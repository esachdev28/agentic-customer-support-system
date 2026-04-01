# 🔄 System Workflow

1. **Ingestion:** The system receives a query via API or Webhook.
2. **Context Enrichment:** The **Intake Classifier** and **Sentiment Analyzer** process the text in parallel to understand *what* the user wants and *how* they feel.
3. **Retrieval:** The **FAQ Agent** performs a semantic search against the knowledge base.
4. **Decision Gate:** The **Escalation Handler** evaluates:
   - If sentiment is highly negative -> **Immediate Escalation**.
   - If the query is complex/technical -> **Ticket Creation**.
   - If a valid FAQ exists -> **AI Response Generation**.
5. **Output:** The final response is delivered back to the user interface, or a human agent is notified via the support platform.
