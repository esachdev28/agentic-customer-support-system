Complete System ARCHITECHTURE!
Scenario 1 — Bot flow (18 steps): User types → Frontend stores to Supabase → triggers n8n webhook → LLM classifies → sentiment analysis → safety check → Gemini embeds query → Pinecone vector search → Groq generates response → n8n writes bot reply to Supabase → Realtime WebSocket fires → Frontend deduplicates → UI renders.
Scenario 2 — Human escalation (20 steps): User sends → Frontend stores + triggers n8n → AI detects high urgency/angry sentiment → n8n inserts pending_human → Realtime notifies both user UI and agent panel → Agent reads, replies directly to Supabase → both UIs update simultaneously via Realtime → Agent closes chat → state pushed as closed → UI reflects final state. n8n is visually marked as bypassed in the direct reply phase.
Polling fallback shown separately at the bottom as a dashed red parallel path — GET every 3s with dedup before render.


<img width="500" height="800" alt="image" src="https://github.com/user-attachments/assets/995df14f-40f1-4318-a76f-239ef19ec23d" />
