"""Train the research topic model from the PDFs in backend/contents (port of the Colab notebook).

Run once, or let topic_router do it on first start when no saved model exists:
    cd backend && python train_topics.py            # trains only if the model is missing
    cd backend && python train_topics.py --force    # retrain after adding/removing PDFs

Writes into the same folder: menstrual_bertopic_model/, document_store.json, cloud_terms.json, topic_*.html
"""
import json
import logging
import os
import re
import sys
from pathlib import Path

from dotenv import dotenv_values, load_dotenv

_ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_FILE)
# huggingface_hub reads HF_TOKEN from the environment; an empty shell export would otherwise shadow .env
if not os.environ.get("HF_TOKEN") and dotenv_values(_ENV_FILE).get("HF_TOKEN"):
    os.environ["HF_TOKEN"] = dotenv_values(_ENV_FILE)["HF_TOKEN"] or ""

logger = logging.getLogger("uvicorn.error")

DATA_DIR = Path(os.environ.get("INSYNC_DATA_DIR") or Path(__file__).resolve().parent / "contents")
MODEL_DIR_NAME = "menstrual_bertopic_model"
EMBED_MODEL = os.environ.get("INSYNC_EMBED_MODEL", "pritamdeka/S-Scibert-snli-multinli-stsb")

METHOD_WORDS = ["prisma", "jbi", "inclusion criteria", "exclusion criteria", "quality assessment",
                "critical appraisal", "risk of bias", "pubmed", "scopus", "search strategy",
                "selected studies", "screened", "reviewers", "data extraction", "newcastle",
                "eligibility", "search terms", "full-text", "full text"]

SEED_TOPIC_LIST = [
    ["dysmenorrhea", "menorrhagia", "heavy menstrual bleeding", "irregular cycles", "oligomenorrhea", "amenorrhea"],
    ["pcos", "polycystic ovary", "hormonal", "thyroid", "anemia", "endometriosis", "premenstrual syndrome"],
    ["bmi", "obesity", "diet", "junk food", "physical activity", "sleep", "age at menarche"],
    ["stress", "anxiety", "depression", "education", "socioeconomic", "rural urban", "family history"],
    ["health seeking", "treatment", "self medication", "consultation", "gynecologist", "ayurveda", "home remedies"],
    ["stigma", "awareness", "taboo", "hygiene", "sanitary", "cost", "barriers", "healthcare access"],
]

ADMIN_STOPWORDS = {
    "study", "studies", "review", "article", "articles", "included", "search", "database",
    "pubmed", "scopus", "embase", "authors", "author", "table", "figure", "fig", "page",
    "doi", "journal", "published", "copyright", "license", "open", "access", "http", "https",
    "org", "ci", "al", "et", "pp", "vol", "india", "indian",
    "shows", "shown", "given", "present", "considered", "reported", "found", "using",
    "used", "based", "however", "also", "may", "among", "including", "different",
    "menstrual", "menstruation", "disorders", "disorder", "health", "girls", "women",
    "quality", "guidelines", "criteria", "selected", "data", "reproductive", "prevalence",
    "cross", "sectional", "participants", "respondents", "sample", "total",
    "percent", "years", "year", "age", "aged",
    "jungari", "did", "pre", "questionnaire", "tested", "characteristics", "approach",
    "maternal", "mortality", "much", "many", "multiple", "areas", "marriage",
    "lack", "knowledge", "public", "symptoms", "result", "results",
    "nhp", "orientation", "reference", "board", "deviation",
    "care", "cycle", "self", "materials", "level", "asia",
}

# Only generic and boilerplate words are removed. Domain words (menstrual, pain, bleeding...) are kept.
CLOUD_STOP = {
    "study", "studies", "review", "article", "articles", "included", "search", "database",
    "pubmed", "scopus", "embase", "authors", "author", "table", "figure", "fig", "page",
    "doi", "journal", "published", "copyright", "license", "open", "access", "http", "https",
    "org", "ci", "al", "et", "pp", "vol", "india", "indian", "results", "result", "data",
    "using", "used", "based", "however", "also", "may", "among", "including", "different",
    "found", "reported", "shown", "given", "present", "total", "sample", "participants",
    "respondents", "selected", "criteria", "quality", "guidelines", "per", "cent", "percent",
    "year", "years", "aged", "nhp", "orientation", "reference", "board", "deviation",
    "did", "much", "many", "multiple", "high", "low", "level", "levels", "one", "two",
}


def extract_chunks_from_paper(pdf_path, window=4, stride=2, min_chars=150, max_chars=1800):
    import pymupdf

    with pymupdf.open(pdf_path) as doc:
        text = "\n".join(str(page.get_text("text")) for page in doc)

    text = re.sub(r"-\n(?=[a-z])", "", text)
    text = re.sub(r"\s+", " ", text)

    cut = len(text)
    for m in re.finditer(r"\b(References|Acknowledg(?:e)?ments|Disclosure statement|Author contributions)\b", text):
        if m.start() > len(text) * 0.5:
            cut = min(cut, m.start())
    text = text[:cut]

    text = re.sub(r"http\S+|www\.\S+|\S+@\S+", " ", text)
    text = re.sub(r"\[\d+(?:\s*[,–-]\s*\d+)*\]", " ", text)
    text = re.sub(r"\([^()]*\b(19|20)\d{2}\b[^()]*\)", " ", text)
    text = re.sub(r"GLOBAL HEALTH ACTION|Taylor & Francis|CONTACT", " ", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()

    sentences = [s for s in re.split(r"(?<=[.!?])\s+", text) if len(s) > 40]
    chunks = []
    for i in range(0, len(sentences), stride):
        c = " ".join(sentences[i:i + window])
        if min_chars <= len(c) <= max_chars:
            chunks.append(c)
    return chunks


def load_corpus(data_dir):
    corpus = []
    for pdf in sorted(data_dir.glob("*.pdf")):
        chunks = extract_chunks_from_paper(pdf)
        logger.info("%s -> %d chunks", pdf.name, len(chunks))
        corpus.extend(chunks)
    return [d for d in corpus if not any(w in d.lower() for w in METHOD_WORDS)]


def cloud_terms(corpus, limit=150):
    import numpy as np
    from sklearn.feature_extraction import text
    from sklearn.feature_extraction.text import CountVectorizer

    # binary=True counts each word once per chunk, so a big number means "appears across the papers"
    vec = CountVectorizer(stop_words=list(text.ENGLISH_STOP_WORDS.union(CLOUD_STOP)),
                          token_pattern=r"(?u)\b[A-Za-z]{4,}\b", min_df=5, binary=True)
    counts = np.asarray(vec.fit_transform(corpus).sum(axis=0)).ravel()
    freq = {t.title(): int(c) for t, c in zip(vec.get_feature_names_out(), counts)}
    return [{"text": k, "value": v} for k, v in sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:limit]]


def train(data_dir=DATA_DIR, force=False):
    """Fit BERTopic on the PDFs in data_dir and save everything the topic router serves. Returns True if trained."""
    if (data_dir / MODEL_DIR_NAME).exists() and not force:
        logger.info("Saved topic model found in %s; skipping training (use --force to retrain).", data_dir)
        return False

    corpus = load_corpus(data_dir)
    if not corpus:
        raise RuntimeError(f"No usable PDF text found in {data_dir}")
    logger.info("Training topic model on %d chunks...", len(corpus))

    from bertopic import BERTopic
    from sentence_transformers import SentenceTransformer
    from sklearn.feature_extraction import text
    from sklearn.feature_extraction.text import CountVectorizer
    from umap import UMAP

    topic_model = BERTopic(
        embedding_model=SentenceTransformer(EMBED_MODEL),
        umap_model=UMAP(n_neighbors=10, n_components=5, min_dist=0.0, metric="cosine", random_state=42),
        vectorizer_model=CountVectorizer(stop_words=list(text.ENGLISH_STOP_WORDS.union(ADMIN_STOPWORDS)),
                                         token_pattern=r"(?u)\b[A-Za-z]{3,}\b", min_df=2),
        seed_topic_list=SEED_TOPIC_LIST,
        min_topic_size=8,
        top_n_words=30,
    )
    topic_model.fit_transform(corpus)
    topic_model.save(str(data_dir / MODEL_DIR_NAME), serialization="safetensors",
                     save_ctfidf=True, save_embedding_model=EMBED_MODEL)

    with open(data_dir / "document_store.json", "w", encoding="utf-8") as f:
        json.dump([{"chunk_id": i, "text": d} for i, d in enumerate(corpus)], f, ensure_ascii=False)
    with open(data_dir / "cloud_terms.json", "w", encoding="utf-8") as f:
        json.dump(cloud_terms(corpus), f, ensure_ascii=False)

    charts = {"topic_distance_map": topic_model.visualize_topics,
              "topic_barchart": lambda: topic_model.visualize_barchart(top_n_topics=6, n_words=8),
              "topic_hierarchy": topic_model.visualize_hierarchy}
    for name, make in charts.items():
        try:
            make().write_html(data_dir / f"{name}.html")
        except Exception as e:  # e.g. too few topics for the distance map
            logger.warning("Chart %s skipped: %s", name, e)

    logger.info("Topic model saved to %s", data_dir / MODEL_DIR_NAME)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    train(force="--force" in sys.argv)
