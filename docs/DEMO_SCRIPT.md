# MindGraph X: 12-Minute Demonstration Script

This script walks through the end-to-end learning intelligence loop:
**Learn -> Understand -> Model -> Predict -> Recommend -> Revise -> Evolve**

---

### Minute 0 - 2: System Vision & Database Health
- **Narrative**: "Welcome to MindGraph X, a personal knowledge graph and learning intelligence system. Traditional learning tools track flashcards in isolation; MindGraph X models your mind's semantic dependencies across PostgreSQL, Neo4j, and Qdrant."
- **Action**: Look at the top navigation bar. Notice the **DBs Active (3/3)** badge showing real-time connectivity to Postgres, Neo4j, and Qdrant with sub-2ms latencies.
- **Key Note**: Point out non-negotiable rule #7: MindGraph X *estimates forgetting probability* using spaced cognitive stability decay, rather than claiming exact memory prediction.

---

### Minute 2 - 4: The Dashboard & The Active Bottleneck
- **Narrative**: "Looking at the dashboard, we see a Knowledge Strength of 64%, Memory Risk Index of 33%, and a Critical Bottleneck alert for **Attention**."
- **Action**:
  - Show the 7-day Knowledge Strength & Retention AreaChart.
  - Hover over the **Active Bottlenecks** card. Explain why Attention (~27% verified mastery) is blocking 5 downstream topics (Transformer, LLM, Embeddings, Vector Search, and RAG).
  - Review the **Recommended Actions** cards and expand the "Why?" checkmark list to demonstrate full transparency.

---

### Minute 4 - 6: The Semantic Knowledge Graph
- **Action**: Navigate to the **Knowledge Graph** tab.
- **Narrative**: "This is a brain-inspired force-directed visualization of the learner's semantic knowledge graph rendered in 2D."
- **Visuals**:
  - Point out node sizes representing graph degree.
  - Colors represent verified confidence: Green (&ge;70%), Yellow (45-69%), Red (&lt;45%).
  - Notice the **glowing rose aura on Attention**, immediately signaling it as an active bottleneck.
  - Hover over Attention to highlight its connected neighbors.
  - Click on **Attention** to open the slide-out **Concept State Panel**.
  - Show the **"Why 27%?" Bar Chart**: 30% quiz accuracy, 20% revision frequency, 15% recency decay, 20% practical usage, 15% activity depth.

---

### Minute 6 - 7: Prerequisite Gap Traversal
- **Action**: Navigate to the **Knowledge Gaps** tab.
- **Narrative**: "Let's say our goal is mastering **RAG (Retrieval-Augmented Generation)**. The system performs a Cypher-style path traversal up to depth 4."
- **Visuals**:
  - View the critical dependency path: `Linear Algebra -> Neural Networks -> Sequence Modeling -> Attention -> Transformer -> Vector Search -> RAG`.
  - Notice that **Attention** is flagged in bold red as the primary weak link causing high gap severity.

---

### Minute 7 - 9: The Closed Learning Loop (The Key Demo Moment!)
- **Action**:
  - Click **"Verify with Diagnostic Quiz"** on Attention (or go to the **Diagnostic Quiz** tab).
  - Take the 5-question schema-validated multiple-choice diagnostic test.
  - Answer the questions on scaled dot-product attention ($\text{Softmax}(QK^T / \sqrt{d_k})V$) and submit.
- **The Key Demo Moment**:
  - Confetti fires!
  - The **Before vs After State Comparison Screen** appears:
    - **Verified Mastery**: Before (27%) &rarr; After (46%) (**+19% gain**)
    - **Forgetting Probability**: Before (74%) &rarr; After (40%) (**-34% risk reduction**)
    - Stability duration extended, bottleneck pressure reduced.
    - Pedagogical explanations displayed for every choice.

---

### Minute 9 - 10: Revision Planner & Spaced Repetition
- **Action**: Navigate to the **Revision Planner** tab.
- **Narrative**: "Cognitive science shows that marathon cramming fails. MindGraph X packs prioritized opportunities into 20-minute focused slots with 5-minute restorative consolidation breaks."
- **Interaction**: Click **"Mark Done"** on the first session to log a revision and trigger an automatic stability update.

---

### Minute 10 - 11: Grounded AI Mentor
- **Action**: Navigate to the **Grounded AI Mentor** tab.
- **Interaction**:
  - Click the suggested prompt: *"Why is Attention considered my active bottleneck right now?"*
  - The mentor answers strictly grounded in Vaswani et al. and the learner's live graph state.
  - Expand the **Evidence & Semantic Grounding** drawer.
  - Show the 94% grounding score, exact document citations (`Attention Is All You Need`), and zero-hallucination check.

---

### Minute 11 - 12: Evaluation Harness & Wrap-Up
- **Action**: Navigate to the **Evaluation Harness** tab.
- **Showcase**:
  - Concept Extraction: F1 Score of 86.2% across 42 hand-labeled papers.
  - Relationship Accuracy: 89.1% across the 4 allowed relationship types (`prerequisite_of`, `part_of`, `depends_on`, `related_to`).
  - Forgetting Calibration: AUC of 0.914, MAE of 0.062 with binned prediction vs actual failure curve.
  - Recommendation Benchmark: MindGraph X Opportunity Engine achieves 86.8% Precision@K, delivering a 1.68x learning efficiency gain over baselines.
