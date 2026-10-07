# MindGraph X: AI-Powered Personal Knowledge Graph & Learning Intelligence System

MindGraph X is a personal knowledge graph and learning intelligence system designed around the continuous cognitive cycle:
$$\text{Learn} \longrightarrow \text{Understand} \longrightarrow \text{Model} \longrightarrow \text{Predict} \longrightarrow \text{Recommend} \longrightarrow \text{Revise} \longrightarrow \text{Evolve}$$

## Run Locally

Requirements: Node.js 20.19+ or 22.12+. Python 3 is only needed for document extraction and Python tests.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Set `GEMINI_API_KEY` to enable Gemini-powered responses; the app uses local fallbacks when it is unset. Password-reset emails are logged to the server console unless an email provider is configured. The server listens on port 3000.

For a production-mode local run, build first, then start the server with `NODE_ENV=production` set in the environment. The server serves the generated `dist` directory.

---

## Architecture & Data Ownership

| Store | Purpose | Scoping |
| :--- | :--- | :--- |
| **In-memory workspace** | Concepts, relations, documents, chunks, quizzes, and timeline events | Per-user workspace in the running server process |
| **`data/users.json`** | User accounts | Loaded and saved by the server |
| **Gemini API (optional)** | AI responses, extraction, and generation | Enabled by `GEMINI_API_KEY`; local fallbacks are used otherwise |

The current server does not connect to PostgreSQL, Neo4j, or Qdrant. `docker-compose.yml` describes optional infrastructure for a future/potential backend and is not required to run this implementation. Workspace changes are lost when the server restarts; the health endpoint reports this local storage mode.

---

## Pure Mathematical Formulations

MindGraph X follows **Rule #2**: the intelligence layer consists of pure, unit-tested functions without internal database side-effects.

### 1. Confidence Model
$$\text{Confidence} = 0.30 \times \text{quiz} + 0.20 \times \text{revision\_freq} + 0.15 \times \text{recency} + 0.20 \times \text{practical\_usage} + 0.15 \times \text{learning\_activity}$$
Each factor is strictly normalized between $0.0$ and $1.0$, returning a complete breakdown dictionary for UI explanation.

### 2. Cognitive Stability & Forgetting Probability Estimation
$$\text{Stability} = \frac{\text{base} \times (1 + n_{\text{revisions}}) \times (0.5 + \text{confidence}) \times (1 + \text{usage})}{0.5 + \frac{\text{difficulty}}{5}}$$
$$\text{Retention} = \exp\left(-\frac{\text{days\_since\_revision}}{\text{stability}}\right)$$
$$\text{Forgetting Risk} = 1 - \text{Retention}$$
*Wording requirement: Never claim exact memory prediction; estimates forgetting probability.*

### 3. Structural Bottleneck Discovery
$$\text{Bottleneck Score} = (1 - \text{Confidence}) \times \text{Downstream Dependency Count} \times \text{Mean Dependency Importance}$$
In the seed graph, **Attention** evaluates to $\approx 27\%$ confidence, blocking 5 downstream concepts (Transformer, LLM, Embeddings, Vector Search, RAG) with a bottleneck score of $4.20$.

### 4. Opportunity Scoring
Weighted sum of normalized:
- Knowledge Gap ($25\%$)
- Estimated Forgetting Probability ($25\%$)
- Foundational Centrality ($20\%$)
- Downstream Unlock Impact ($15\%$)
- Goal Relevance ($5\%$)
- Unmastered Growth Gap ($10\%$)

---

## Verification Checklist

### Phase 1: Foundation
```bash
npm install
npm run dev
curl http://localhost:3000/health
# Status: healthy; storage mode is local with an in-memory workspace
```

### Phase 2: Knowledge Graph & Ingestion
```bash
curl http://localhost:3000/graph
# Returns nodes, links, and degree/confidence/risk summaries
```

### Phase 3: Knowledge State Engine
```bash
curl http://localhost:3000/concepts/Attention/state
# Returns the full "Why 27%?" factor breakdown
curl http://localhost:3000/gaps?target=RAG
# Returns recursive path traversal with Attention flagged in red
curl http://localhost:3000/bottlenecks
# Returns Attention as Top #1 active bottleneck
```

### Phase 4: Closed Learning Loop
```bash
# 1. Generate MCQ test
curl -X POST http://localhost:3000/quiz/generate -H "Content-Type: application/json" -d '{"concept": "Attention"}'
# 2. Submit test and verify Before vs After state delta
curl -X POST http://localhost:3000/quiz/submit -H "Content-Type: application/json" -d '{"concept_name": "Attention", "answers": []}'
```

### Phase 5: Grounded AI Mentor
```bash
curl -X POST http://localhost:3000/mentor/ask -H "Content-Type: application/json" -d '{"question": "Why is Attention a bottleneck for Transformers?"}'
# Returns answer with exact document citations and evidence
```

### Phase 6: Demo Seed
```bash
python scripts/seed_demo.py
# Prints computed demo metrics. The server initializes its own demo workspace on startup.
```

### Phase 7: Evaluation Suite
```bash
python -m unittest discover -s tests -v
# Passes all unit tests for confidence, forgetting, extraction, and bottlenecks
```
