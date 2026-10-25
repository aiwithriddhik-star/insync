from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from chat_routes import router as chat_router
from upload_routes import router as upload_router
from service import router as service_router

app = FastAPI(title="Document Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(service_router)


@app.get("/")
def health_check():
    return {"status": "online"}
