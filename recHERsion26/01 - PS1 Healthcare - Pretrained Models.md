---
tags:
  - hackathon
  - recHERsion26
  - PS1
  - models
created: 2026-10-24
---
# PS1: Pretrained healthcare models (repos and papers)

Back to [[00 - Rulebook & Problem Statements]]. Datasets and literature are in [[02 - PS1 Healthcare - Datasets & Papers]].

> [!info] How these were checked (24 Oct 2026)
> - **Hugging Face IDs:** checked through the HF API. **GitHub repos:** checked through the GitHub API.
> - **Papers:** checked through arXiv and Crossref.
> - **[NV]** = not verified.
> - **Gated** = you must accept the terms on Hugging Face before downloading, so **request access now**.
> - VRAM figures are estimates.

## ⭐ Top shortlist for a 30-hour build
| # | Model | Role in the app | Weights | Code | Paper | Licence |
|---|---|---|---|---|---|---|
| 1 | **MedGemma 4B-it** | Main medical engine: Q&A, symptom triage, insights, reads images | [HF](https://huggingface.co/google/medgemma-4b-it) (gated) | [Google-Health/medgemma](https://github.com/Google-Health/medgemma) | Sellergren et al. 2025, [arXiv 2507.05201](https://arxiv.org/abs/2507.05201) | HAI-DEF terms |
| 2 | **MedCPT** | Search engine for RAG over WHO/NHS/MedlinePlus content | [HF](https://huggingface.co/ncbi/MedCPT-Query-Encoder) | [ncbi/MedCPT](https://github.com/ncbi/MedCPT) | Jin et al. 2023, [arXiv 2307.00589](https://arxiv.org/abs/2307.00589) | public domain (NCBI) [NV] |
| 3 | **d4data/biomedical-ner-all** + **scispaCy** | Turns free-text or voice symptom diaries into structured symptoms | [HF](https://huggingface.co/d4data/biomedical-ner-all) | [allenai/scispacy](https://github.com/allenai/scispacy) | Neumann et al. 2019, [doi](https://doi.org/10.18653/v1/W19-5034) | Apache-2.0 |
| 4 | **Whisper large-v3-turbo** / **IndicConformer** + **IndicTrans2** | Voice input and translation for Hindi and other Indian languages | [whisper](https://huggingface.co/openai/whisper-large-v3-turbo) · [IndicConformer](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual) · [IndicTrans2](https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M) | [openai/whisper](https://github.com/openai/whisper) · [AI4Bharat/IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) | [Whisper](https://arxiv.org/abs/2212.04356) · [IndicVoices](https://arxiv.org/abs/2403.01926) · [IndicTrans2](https://arxiv.org/abs/2305.16307) | MIT |
| 5 | **Apollo-7B / Apollo2-7B** | Backup medical LLM with built-in **Hindi** | [HF](https://huggingface.co/FreedomIntelligence/Apollo-7B) | [FreedomIntelligence/Apollo](https://github.com/FreedomIntelligence/Apollo) | Wang et al. 2024, [arXiv 2403.03640](https://arxiv.org/abs/2403.03640) | Apache-2.0 |
| 6 | **Your own XGBoost + SHAP** on the UCI Maternal Risk and Kaggle PCOS data | Explainable risk scores ("why this risk"). There's **no established pretrained model** for this, so train one, which takes minutes | — | [shap](https://github.com/shap/shap) | Lundberg et al. 2020, [doi](https://doi.org/10.1038/s42256-019-0138-9) | — |
| 7 | **MedSigLIP-448** / **BiomedCLIP**, linear probe on BUSI | Breast-ultrasound classifier, trained in under an hour | [MedSigLIP](https://huggingface.co/google/medsiglip-448) · [BiomedCLIP](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224) | [BiomedCLIP pipeline](https://github.com/microsoft/BiomedCLIP_data_pipeline) | Zhang et al., NEJM AI 2025, [doi](https://doi.org/10.1056/AIoa2400640) | HAI-DEF / MIT |
| 8 | **NYU breast_cancer_classifier / GMIC** | Mammogram demo with heatmaps (research only) | weights included in the repo | [nyukat/breast_cancer_classifier](https://github.com/nyukat/breast_cancer_classifier) · [nyukat/GMIC](https://github.com/nyukat/GMIC) | Wu et al., IEEE TMI 2020, [doi](https://doi.org/10.1109/TMI.2019.2945514) | AGPL / non-commercial |

---

## A. Medical LLMs and vision-language models
| Model | Weights | GitHub | Paper | Licence | Hardware | Fit (out of 5) |
|---|---|---|---|---|---|---|
| **MedGemma 4B-it / 1.5-4B-it** | [4b](https://huggingface.co/google/medgemma-4b-it) · [1.5-4b](https://huggingface.co/google/medgemma-1.5-4b-it) | [repo](https://github.com/Google-Health/medgemma) | [arXiv 2507.05201](https://arxiv.org/abs/2507.05201) | HAI-DEF, gated | ~4 GB at 4-bit, runs on a Colab T4 | **5** |
| MedGemma 27B (text / multimodal) | [text](https://huggingface.co/google/medgemma-27b-text-it) · [mm](https://huggingface.co/google/medgemma-27b-it) | same | same | HAI-DEF | A100, or ~16 GB at 4-bit | 3 |
| **MedSigLIP-448** (image embeddings) | [HF](https://huggingface.co/google/medsiglip-448) | same | same | HAI-DEF | CPU or small GPU | 4 |
| **Apollo / Apollo2-7B** (has Hindi) | [v1](https://huggingface.co/FreedomIntelligence/Apollo-7B) · [v2](https://huggingface.co/FreedomIntelligence/Apollo2-7B) | [repo](https://github.com/FreedomIntelligence/Apollo) | [arXiv 2403.03640](https://arxiv.org/abs/2403.03640) | Apache-2.0 | 14 GB; 0.5–2B variants too | **4** |
| ApolloMoE (50 languages) | [HF](https://huggingface.co/FreedomIntelligence/Apollo-MoE-7B) | [repo](https://github.com/FreedomIntelligence/ApolloMoE) | [arXiv 2410.10626](https://arxiv.org/abs/2410.10626) | Apache-2.0 | 7B | 3 |
| **BiomedCLIP** | [HF](https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224) | [repo](https://github.com/microsoft/BiomedCLIP_data_pipeline) | [NEJM AI 2025](https://doi.org/10.1056/AIoa2400640) | MIT | CPU | **4** |
| Lingshu-7B (2025) | [HF](https://huggingface.co/lingshu-medical-mllm/Lingshu-7B) | [repo](https://github.com/alibaba-damo-academy/lingshu) | [arXiv 2506.07044](https://arxiv.org/abs/2506.07044) | MIT | 16 GB | 3 |
| HuatuoGPT-o1-8B (reasoning) | [HF](https://huggingface.co/FreedomIntelligence/HuatuoGPT-o1-8B) | [repo](https://github.com/FreedomIntelligence/HuatuoGPT-o1) | [arXiv 2412.18925](https://arxiv.org/abs/2412.18925) | Apache-2.0 | 16 GB | 3 |
| HuatuoGPT-Vision-7B | [HF](https://huggingface.co/FreedomIntelligence/HuatuoGPT-Vision-7B) | [repo](https://github.com/FreedomIntelligence/HuatuoGPT-Vision) | [arXiv 2406.19280](https://arxiv.org/abs/2406.19280) | Apache-2.0 | 16 GB | 3 |
| Med42-v2 8B | [HF](https://huggingface.co/m42-health/Llama3-Med42-8B) | [repo](https://github.com/m42-health/med42) | [arXiv 2408.06142](https://arxiv.org/abs/2408.06142) | Llama 3 | 16 GB | 3 |
| BioMistral-7B | [HF](https://huggingface.co/BioMistral/BioMistral-7B) | [repo](https://github.com/BioMistral/BioMistral) | [ACL Findings 2024](https://doi.org/10.18653/v1/2024.findings-acl.348) | Apache-2.0 | ~5 GB at 4-bit | 3 |
| OpenBioLLM-8B | [HF](https://huggingface.co/aaditya/Llama3-OpenBioLLM-8B) | — | blog only | Llama 3 | 16 GB | 3 |
| Meditron3-8B | [HF](https://huggingface.co/EPFLiGHT/Meditron3-8B) | — | [NV] | [NV] | 16 GB | 3 |
| Meditron 7B/70B | [7b](https://huggingface.co/epfl-llm/meditron-7b) | [epfLLM/meditron](https://github.com/epfLLM/meditron) | [arXiv 2311.16079](https://arxiv.org/abs/2311.16079) | Llama 2 | 14 GB | 2 (outdated) |
| MMed-Llama-3-8B (6 languages, **no Indian languages**) | [HF](https://huggingface.co/Henrychur/MMed-Llama-3-8B) | [repo](https://github.com/MAGIC-AI4Med/MMedLM) | [Nat Commun 2024](https://doi.org/10.1038/s41467-024-52417-z) | Llama 3 | 16 GB | 2 |
| PMC-LLaMA 13B | [HF](https://huggingface.co/axiong/PMC_LLaMA_13B) | [repo](https://github.com/chaoyi-wu/PMC-LLaMA) | [arXiv 2304.14454](https://arxiv.org/abs/2304.14454) | OpenRAIL | 26 GB | 2 |
| LLaVA-Med v1.5 | [HF](https://huggingface.co/microsoft/llava-med-v1.5-mistral-7b) | [repo](https://github.com/microsoft/LLaVA-Med) | [arXiv 2306.00890](https://arxiv.org/abs/2306.00890) | research use only | 15 GB | 2 |
| Baichuan-M2-32B | [HF](https://huggingface.co/baichuan-inc/Baichuan-M2-32B) | [repo](https://github.com/baichuan-inc/Baichuan-M2-32B) | [arXiv 2509.02208](https://arxiv.org/abs/2509.02208) | Apache-2.0 | ~20 GB at 4-bit | 2 |
| Clinical Camel 70B | [HF](https://huggingface.co/wanglab/ClinicalCamel-70B) | [repo](https://github.com/bowang-lab/clinical-camel) | [arXiv 2305.12031](https://arxiv.org/abs/2305.12031) | CC-BY-NC | multiple GPUs | 1 |
| Med-PaLM 2 | **closed** | — | [Nature 2023](https://doi.org/10.1038/s41586-023-06291-2) | proprietary | — | 1 |
| Sarvam-M (general Indic LLM, not medical) | [HF](https://huggingface.co/sarvamai/sarvam-m) | — | — | Apache-2.0 | 24B or API | 3 (front end for Indian languages only) |

## B. Clinical NLP (symptom extraction, NER, linking to medical codes)
| Model | Use | Link | Paper | Licence | Fit |
|---|---|---|---|---|---|
| **scispaCy** | Biomedical NER plus UMLS concept linker | [repo](https://github.com/allenai/scispacy) | [BioNLP 2019](https://doi.org/10.18653/v1/W19-5034) | Apache-2.0 | **5** |
| **d4data/biomedical-ner-all** | 107 entity types incl. sign/symptom; one-line HF pipeline | [HF](https://huggingface.co/d4data/biomedical-ner-all) | — | Apache-2.0 | **4** |
| Med7 | Medication NER (drug, dose, frequency) | [HF](https://huggingface.co/kormilitzin/en_core_med7_lg) · [repo](https://github.com/kormilitzin/med7) | [AIIM 2021](https://doi.org/10.1016/j.artmed.2021.102086) | MIT | 4 |
| MedCPT | Retrieval embeddings for RAG | [HF](https://huggingface.co/ncbi/MedCPT-Query-Encoder) · [repo](https://github.com/ncbi/MedCPT) | [arXiv 2307.00589](https://arxiv.org/abs/2307.00589) | NCBI | 4 |
| SapBERT | Maps free-text symptoms to UMLS concepts | [HF](https://huggingface.co/cambridgeltl/SapBERT-from-PubMedBERT-fulltext) · [repo](https://github.com/cambridgeltl/sapbert) | [NAACL 2021](https://arxiv.org/abs/2010.11784) | Apache-2.0 | 3 |
| MedCAT | Concept extraction to SNOMED/UMLS | [repo](https://github.com/CogStack/MedCAT) | [AIIM 2021](https://doi.org/10.1016/j.artmed.2021.102083) | Apache-2.0 (UMLS licence needed) | 3 |
| Medical-NER (DeBERTa) | Medical NER | [HF](https://huggingface.co/blaze999/Medical-NER) | — | MIT | 3 |
| BioBERT | Base model for fine-tuning | [HF](https://huggingface.co/dmis-lab/biobert-v1.1) · [repo](https://github.com/dmis-lab/biobert) | [Bioinformatics 2020](https://doi.org/10.1093/bioinformatics/btz682) | Apache-2.0 [NV] | 2 |
| Bio_ClinicalBERT | Encoder trained on clinical notes | [HF](https://huggingface.co/emilyalsentzer/Bio_ClinicalBERT) · [repo](https://github.com/EmilyAlsentzer/clinicalBERT) | [ClinicalNLP 2019](https://doi.org/10.18653/v1/W19-1909) | MIT | 2 |
| BiomedBERT (PubMedBERT) | Encoder | [HF](https://huggingface.co/microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext) | [ACM HEALTH 2021](https://doi.org/10.1145/3458754) | MIT | 2 |
| GatorTron | Large clinical encoder | [HF](https://huggingface.co/UFNLP/gatortron-base) | [npj DM 2022](https://doi.org/10.1038/s41746-022-00742-2) | Apache-2.0 | 2 |

## C. Women's-health-specific models
| Area | Model | Link | Paper | Licence | Fit / note |
|---|---|---|---|---|---|
| Breast cancer risk (mammogram) | **Mirai** | [yala/Mirai](https://github.com/yala/Mirai) | Yala et al., Sci Transl Med 2021, [doi](https://doi.org/10.1126/scitranslmed.aba4373) | MIT | 3: needs DICOM images. Weights not confirmed as freely downloadable [NV] |
| Breast cancer (mammogram) | **NYU breast_cancer_classifier** | [repo](https://github.com/nyukat/breast_cancer_classifier) | IEEE TMI 2020, [doi](https://doi.org/10.1109/TMI.2019.2945514) | AGPL / non-commercial weights | 3: demo only |
| Breast cancer (mammogram) | **GMIC** (with saliency maps) | [repo](https://github.com/nyukat/GMIC) | [arXiv 2002.07613](https://arxiv.org/abs/2002.07613) | AGPL | 3 |
| Breast cancer (mammogram) | Mammo-CLIP | [repo](https://github.com/batmanlab/Mammo-CLIP) | MICCAI 2024, [doi](https://doi.org/10.1007/978-3-031-72390-2_59) | check repo | 2 |
| Breast ultrasound | BUSI community fine-tunes | [SigLIP](https://huggingface.co/ghostsas001/busi-breast-ultrasound-siglip) · [ViT](https://huggingface.co/ITSheep/breastcancer-ultrasound-ViT) | dataset: [DiB 2020](https://doi.org/10.1016/j.dib.2019.104863) | Apache-2.0 / none | 3: unclear origin, safer to retrain yourself (about 1 hour) |
| Prenatal ultrasound | **FetalCLIP** | [HF](https://huggingface.co/numansaeed/fetalclip-model) · [repo](https://github.com/BioMedIA-MBZUAI/FetalCLIP) | [arXiv 2502.14807](https://arxiv.org/abs/2502.14807) | CC-BY-NC | 3: the only real prenatal foundation model |
| Cervical (Pap smear) | SIPaKMeD CNNs | [Two-Step-Feature-Enhancement](https://github.com/Rohit-Kundu/Two-Step-Feature-Enhancement) · [CNN-GA](https://github.com/Rohit-Kundu/Cervical-Cancer-CNN-GA) | dataset: [ICIP 2018](https://doi.org/10.1109/ICIP.2018.8451588) | MIT | 2: no established weights, so fine-tune your own |
| Maternal risk | XGBoost on UCI 863 | [Peco602/maternal-health-risk](https://github.com/Peco602/maternal-health-risk) | dataset: Ahmed et al. 2020 | CC-BY data | **4**: trains in 10 minutes |
| PCOS | — | only student repos | — | — | 2: train XGBoost on the Kaggle data yourself |
| Anemia (eye or nail-bed photos) | pallor classifiers | [HF 1](https://huggingface.co/galihkjaya/anemia-palor-detection) · [HF 2](https://huggingface.co/thismad/vit-anemia-conjunctiva) | — | MIT | 2: unclear origin; call it a "screening hint" only |
| Colposcopy, endometriosis, menopause, postpartum depression, gestational diabetes, preeclampsia, osteoporosis, thyroid | — | **No established pretrained models with public weights** | — | — | Use an LLM with RAG, or train a tabular model on public data |

> [!warning] Licences that block commercial use
> ClinicalCamel, BiomedParse, FetalCLIP and the NYU weights are non-commercial, and LLaVA-Med is research-only. They're fine for the hackathon demo, but say so in the README.

## D. Imaging foundation models (brief)
- **MedSAM / MedSAM2:** segmentation you guide by clicking or drawing a box.
  - Weights: [HF](https://huggingface.co/wanglab/medsam-vit-base). Code: [repo](https://github.com/bowang-lab/MedSAM) · [MedSAM2](https://github.com/bowang-lab/MedSAM2).
  - Papers: [Nat Commun 2024](https://doi.org/10.1038/s41467-024-44824-z) · [arXiv 2504.03600](https://arxiv.org/abs/2504.03600).
  - Licence: Apache-2.0.
- **BiomedParse:** segmentation from a text prompt.
  - Weights: [HF](https://huggingface.co/microsoft/BiomedParse). Code: [repo](https://github.com/microsoft/BiomedParse).
  - Paper: [Nat Methods 2024](https://doi.org/10.1038/s41592-024-02499-w).
  - Licence: CC-BY-NC-SA.
- **RETFound:** retina images. Code: [repo](https://github.com/rmaphoh/RETFound). Paper: [Nature 2023](https://doi.org/10.1038/s41586-023-06555-x). Low relevance.
- **CheXagent** ([repo](https://github.com/Stanford-AIMI/CheXagent)) and **TorchXRayVision** ([repo](https://github.com/mlmed/torchxrayvision)): chest X-ray only. Low relevance.
- **MONAI model zoo:** [repo](https://github.com/Project-MONAI/model-zoo). Nothing specific to women's health.
- **Google HAI-DEF family:** [HeAR](https://huggingface.co/google/hear) (cough and breath audio), [derm-foundation](https://huggingface.co/google/derm-foundation) (skin), [path-foundation](https://huggingface.co/google/path-foundation) (pathology).

## E. Speech and Indian languages
| Model | Link | Paper | Licence | Fit |
|---|---|---|---|---|
| Whisper large-v3-turbo | [HF](https://huggingface.co/openai/whisper-large-v3-turbo) · [repo](https://github.com/openai/whisper) | [arXiv 2212.04356](https://arxiv.org/abs/2212.04356) | MIT | 4 |
| IndicConformer 600M (speech recognition, 22 languages) | [HF](https://huggingface.co/ai4bharat/indic-conformer-600m-multilingual) · [repo](https://github.com/AI4Bharat/IndicConformerASR) | [arXiv 2403.01926](https://arxiv.org/abs/2403.01926) | MIT | 4 |
| IndicTrans2 200M (translation) | [en→indic](https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M) · [indic→en](https://huggingface.co/ai4bharat/indictrans2-indic-en-dist-200M) · [repo](https://github.com/AI4Bharat/IndicTrans2) | [TMLR 2023](https://arxiv.org/abs/2305.16307) | MIT | 4 |
| Sarvam-Translate | [HF](https://huggingface.co/sarvamai/sarvam-translate) | — | [NV] | 3 |

## Gaps and links that didn't work
- **404:** `epfl-llm/meditron` on GitHub. The correct path is `epfLLM/meditron`.
- **Not found:** the GatorTron GitHub repo and `yala/MiraiPublic`.
- **401 (access refused):** HuatuoGPT-II-7B on Hugging Face.
- No established model weights exist for endometriosis, menopause, postpartum depression, gestational diabetes or PCOS. This gap is itself a point for the pitch.
