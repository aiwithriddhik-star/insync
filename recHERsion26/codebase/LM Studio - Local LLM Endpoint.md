---
tags:
  - codebase
  - llm
  - lmstudio
verified: 2026-10-25
---
# LM Studio - Local LLM Endpoint

I checked this against the running server on 2026-10-25. See also [[Backend - LLM Integration Points]] and [[Frontend - API Contract]].

## Native chat API
`POST http://localhost:1234/api/v1/chat`

Request:
```json
{
  "model": "medgemma-4b-it-mlx",
  "system_prompt": "…",
  "input": "…"
}
```

Response:
```json
{
  "model_instance_id": "medgemma-4b-it-mlx",
  "output": [{ "type": "message", "content": "Hi!\n" }],
  "stats": {
    "input_tokens": 15, "total_output_tokens": 4, "reasoning_output_tokens": 0,
    "tokens_per_second": 124.35, "time_to_first_token_seconds": 0.473
  },
  "response_id": "resp_…"
}
```
To get the answer text, join `output[*].content` where `type == "message"`.

## Models (`GET /api/v1/models`)
| key | type | notes |
|---|---|---|
| `medgemma-4b-it-mlx` | llm, gemma3, 4-bit MLX | **loaded**. Context 131072, parallel 4. Supports vision. **Not trained for tool use.** |
| `flint` | llm, 4-bit MLX, 22.6 GB | not loaded. Trained for tool use. Context 262k. |
| `embeddinggemma-2` | embedding, BF16 | for RAG embeddings |

## Implications for integration
- MedGemma can't reliably make tool or function calls. Agent-style tool loops (LangChain agents and similar) should either use plain prompting with retrieved context stuffed into the prompt, or switch to `flint`.
- LM Studio also serves OpenAI-compatible `/v1/chat/completions` and `/v1/embeddings`. If the backend already uses an OpenAI-style client, we can usually just set `base_url=http://localhost:1234/v1` with any api_key.
- Put base URL and model name in config or env vars (`LMSTUDIO_BASE_URL`, `LMSTUDIO_MODEL`), not in code.
