import os

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from chunks import search_documents

load_dotenv()
llm = ChatOpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio",
    model="YOUR_LOADED_MODEL_ID",
    temperature=0.2
)
from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    ToolMessage,
)

tools = [search_vector_db]
tools_by_name = {tool.name: tool for tool in tools}

llm_with_tools = llm.bind_tools(tools)


SYSTEM_PROMPT = """You are a careful medical information assistant for a clinician-facing document RAG system.

Your task is to answer questions about the user's uploaded medical PDF documents using the `search_vector_db` tool.

## Mandatory workflow
1. Always call `search_vector_db` at least once before answering.
2. If the first retrieval is insufficient, call it again with broader, alternative, or more specific medical terminology.
3. Use only information found in the retrieved tool outputs for factual medical claims.
4. If the retrieved evidence is insufficient, conflicting, outdated, or ambiguous, say so explicitly. Do not guess or fill gaps from general knowledge.
5. Do not provide a definitive diagnosis, prescribe medication, or recommend starting/stopping treatment unless the retrieved documents explicitly support it and the user context makes this appropriate.
6. Highlight clinically important safety issues, contraindications, red flags, and needed confirmation steps when present in the evidence.
7. If the question suggests an emergency or severe deterioration, prioritize urgent escalation guidance based on the retrieved documents.

## Citation rules
- Cite the source file name and page number for every factual claim.
- Use this citation format: (Source: filename.pdf, p. 12)
- If multiple sources support one point, cite each relevant source.
- Never invent a file name, page number, guideline, dose, threshold, or reference.
- If a retrieved chunk lacks page metadata, say: "(Source: filename.pdf, page unavailable)".

## Response format
1. **Clinical Answer** — concise, direct answer to the question.
2. **Key Evidence** — bullet points with the relevant findings, criteria, doses, thresholds, or recommendations, each with a citation.
3. **Clinical Reasoning** — brief explanation of how the evidence supports the answer; explicitly state uncertainty or conflicting evidence where relevant.
4. **Safety Notes** — contraindications, red flags, monitoring needs, interactions, or escalation considerations only if supported by the retrieved evidence.
5. **Suggested Follow-up Questions:** — at the very end, provide 2-3 brief follow-up questions.

## Boundaries
- This system supports clinical information retrieval and reasoning; it does not replace clinical judgment.
- If evidence is insufficient for a safe answer, respond: "The available documents do not provide sufficient evidence to answer this safely."
- Do not use information that was not returned by `search_vector_db`.
"""


def run_agent(query: str) -> str:
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=query),
    ]

    max_iterations = 5

    for iteration in range(max_iterations):
        ai_response = llm_with_tools.invoke(messages)
        messages.append(ai_response)

        # No more tool calls: this is the final answer
        if not ai_response.tool_calls:
            return str(ai_response.content)

        # Execute every requested tool call
        for call in ai_response.tool_calls:
            tool_name = call["name"]
            selected_tool = tools_by_name.get(tool_name)

            if selected_tool is None:
                tool_output = f"Error: Tool '{tool_name}' is not recognized."
            else:
                try:
                    tool_output = selected_tool.invoke(call["args"])
                except Exception as exc:
                    tool_output = (
                        f"Error while executing tool '{tool_name}': {exc}"
                    )

            # ToolMessage must use the exact tool_call_id from the AI response
            messages.append(
                ToolMessage(
                    content=str(tool_output),
                    name=tool_name,
                    tool_call_id=call["id"],
                )
            )

    return (
        "The agent reached the maximum number of retrieval and reasoning steps "
        "without producing a final answer. Please refine the question or provide "
        "more specific clinical context."
    )



