# InSync research service

Serves the Learn page word cloud. Built from `insynccc.py` (the Colab notebook).

1. Run the notebook, then download `topic_files.zip` (last cell).
2. Unzip it into this `backend/` folder, so `menstrual_bertopic_model/`, `document_store.json`
   and `cloud_terms.json` sit next to `main.py`.
3. `pip install -r requirements.txt` then `uvicorn main:app --port 8000`.
4. Point the site at it with `VITE_API_BASE` (copy `.env.example` to `.env`).

| Method | Path | Used for |
|---|---|---|
| GET  | `/api/v1/wordcloud?limit=150` | the cloud itself |
| GET  | `/api/v1/drill-down?keyword=pain&limit=5` | passages when a word is selected |
| POST | `/api/v1/classify` `{"text": "..."}` | "Find a related theme" box |
| GET  | `/api/v1/export-cloud-image` | "Download image" button |
| GET  | `/api/v1/charts/topic_barchart` | chart explorer (iframe) |

No backend yet? Copy the notebook's `cloud_terms.json` into `public/` and the cloud still shows (passages and theme matching need the service).
