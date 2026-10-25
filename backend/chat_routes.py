import re
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agent import run_agent
from llm import LLMError


router = APIRouter(
    prefix="/api",
    tags=["Chat & Intelligence"]
)


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    query: str
    source_id: Optional[str] = None
    history: List[ChatTurn] = Field(default_factory=list)


class Source(BaseModel):
    filename: str
    page: Optional[int] = None
    source_id: str = ""


class ChatResponse(BaseModel):
    answer: str
    suggestions: List[str]
    sources: List[Source] = Field(default_factory=list)


# The model may wrap the heading in markdown (**...**, ## ...), so match it loosely
_MARKER = re.compile(r"^[#*\s]*Suggested Follow-up Questions:?[*\s]*$", re.IGNORECASE | re.MULTILINE)
# Strip list markers ("1.", "2)", "-", "*") but keep numbers that belong to the question
_LIST_PREFIX = re.compile(r"^\s*(?:[-*•]+|\d+[.)])\s*")


def format_agent_response(raw_output: str) -> dict:
    """
    Separates the agent's main answer from
    its suggested follow-up questions.
    """
    match = _MARKER.search(raw_output)
    if not match:
        return {"answer": raw_output.strip(), "suggestions": []}

    suggestions = []
    for line in raw_output[match.end():].splitlines():
        text = _LIST_PREFIX.sub("", line).strip(" *")
        if text:
            suggestions.append(text)

    return {
        "answer": raw_output[:match.start()].strip(),
        "suggestions": suggestions[:3]
    }


@router.post(
    "/chat",
    response_model=ChatResponse
)
def chat_endpoint(req: ChatRequest):

    if not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty"
        )

    try:
        raw_output, sources = run_agent(
            req.query,
            source_id=req.source_id,
            history=[t.model_dump() for t in req.history],
        )
    except LLMError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    return {**format_agent_response(raw_output), "sources": sources}
