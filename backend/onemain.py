
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from topic_router import router, topic_lifespan

app = FastAPI(title="InSync research service", lifespan=topic_lifespan)

# The React site runs on another origin (Vite / Figma Make), so the browser needs CORS.
# Only public research data is served; set INSYNC_ALLOWED_ORIGINS="https://your-site" to lock it down.
origins = [o.strip() for o in os.environ.get("INSYNC_ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])


@app.middleware("http")
async def allow_private_network(request, call_next):
    """Chrome asks permission before a public site calls a server on localhost."""
    response = await call_next(request)
    if request.headers.get("access-control-request-private-network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


app.include_router(router)
