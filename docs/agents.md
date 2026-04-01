# 👥 Agent Definitions

Our system is comprised of four specialized agents, each with a distinct persona and responsibility.

### 1. Intake Classifier Agent
- **Purpose:** Acts as the primary router for incoming data.
- **Input:** Raw customer text query.
- **Output:** Category Label (e.g., `BILLING`, `TECHNICAL`, `GENERAL_INFO`) and Priority Score (1-10).
- **Responsibility:** Ensuring the query is routed to the correct specialist agent to minimize latency.

### 2. Sentiment Analyzer Agent
- **Purpose:** Detects the emotional context of the user interaction.
- **Input:** User query and interaction history.
- **Output:** Sentiment Score (Positive, Neutral, Frustrated, Angry) and Intensity (0-1).
- **Responsibility:** Adding emotional intelligence to the response; "Angry" sentiments trigger immediate escalation.

### 3. FAQ Responder Agent
- **Purpose:** Resolves standard queries using the verified knowledge base.
- **Input:** Categorized query and retrieved context from `faq.md`.
- **Output:** Accurate, polite answer OR a "Not Found" flag.
- **Responsibility:** Automating repetitive tasks to free up human resources.

### 4. Escalation Handler Agent
- **Purpose:** The final decision-maker regarding automated vs. human intervention.
- **Input:** Combined data from Classifier, Sentiment, and FAQ agents.
- **Output:** Action Plan (`AUTO_REPLY`, `HUMAN_HANDOFF`, or `INTERNAL_TICKET`).
- **Responsibility:** Guarding the user experience by ensuring complex issues are never "stuck" in an AI loop.
