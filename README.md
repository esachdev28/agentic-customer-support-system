# Agentic Customer Support System 🤖🎧

![Project Logo](project_logo.png)

---

## 🌟 Project Overview

The **Agentic Customer Support System** is a next-generation support framework powered by a **multi-agent AI architecture**. Unlike traditional chatbots, this system intelligently routes, analyzes, and resolves customer queries using specialized AI agents, while seamlessly escalating critical cases to human support.

---

## 🔴 Problem Statement

Modern businesses struggle with **Support Debt**:

* **Latency:** Customers expect instant responses, not hours
* **Rigidity:** Traditional bots fail on complex or emotional queries
* **Cost:** Scaling human teams for 24/7 support is expensive

---

## 💡 Solution Overview

We built an **Agentic AI orchestration system using n8n**, where:

* Simple queries → **resolved instantly via FAQ (RAG)**
* Complex / negative / unsafe queries → **escalated to humans**
* All interactions → **logged + analyzed for insights**

---

## 🧠 Agent Architecture

### 🔹 1. Intake Classifier Agent

* Classifies query into:

  * billing, technical, account, refund, shipping, general
* Assigns **urgency (low / medium / high)**
* Extracts **context summary**

---

### 🔹 2. Sentiment & Safety Analyzer Agent

Goes beyond basic sentiment:

* Detects:

  * sentiment → positive / neutral / frustrated / angry / threatening
  * bad words / abusive language
  * urgency signals
  * threats

* Outputs:

  * `hasBadWords`
  * `isHighlyUrgent`
  * `isThreatening`
  * `escalationReason`

---

### 🔹 3. Decision Layer (Orchestration Logic)

Built using **n8n IF nodes**

Routing logic:

* 🚨 If:

  * bad words OR threatening → **IMMEDIATE ESCALATION**
* ⚠️ Else if:

  * high urgency + angry → **ESCALATION**
* 📚 Else:

  * goes to **FAQ Agent**

---

### 🔹 4. FAQ Responder Agent (RAG)

* Uses **Pinecone Vector DB**
* Retrieves answers from knowledge base
* Rules:

  * MUST use vector store
  * If no answer → returns `NO_MATCH`

---

### 🔹 5. Escalation Handler Agent

Triggered when:

* sentiment is negative / angry / threatening
* FAQ fails (`NO_MATCH`)
* unsafe content detected

Creates a structured **support ticket**

---

## 🧾 Support Ticket Structure (Dynamic)

Stored in database:

* message
* category
* urgency
* context
* sentiment
* escalation_reason
* is_highly_urgent
* is_threatening
* has_bad_words
* priority (P1 / P2 / P3)
* status (ESCALATED / resolved)
* type (human_support / faq_response)
* created_at

---

## 🗄️ Logging & Storage (Supabase)

We integrated **Supabase (PostgreSQL)** for:

* ✅ Storing all support interactions
* ✅ Logging escalations & resolutions
* ✅ Tracking sentiment trends
* ✅ Enabling analytics dashboards

### Table: `support_logs`

All tickets (FAQ + escalated) are stored here.

---

## 📊 Analytics Dashboard

Using Supabase data, we can build dashboards (Power BI / Metabase / Supabase Studio):

### Metrics tracked:

* 📈 Response time
* 📊 Resolution rate
* 😡 Sentiment trends
* 🚨 Escalation frequency
* 📂 Category distribution
* ⚡ Priority breakdown (P1 / P2 / P3)

---

## 👩‍💻 Human-in-the-Loop System

* Escalated tickets are:

  * stored in Supabase
  * visible on dashboard
* Human agents:

  * view context + sentiment + reason
  * reply directly from dashboard (future UI)
* Ensures:

  * high-risk cases handled safely
  * no blind automation

---

## 💬 Chatbot Layer

* Webhook-based entry (chat/email)
* Real-time processing pipeline:

  ```
  User → Webhook → Classifier → Sentiment → Decision
       → FAQ OR Escalation → Response
  ```
* Instant responses for FAQs
* Smart fallback to human agents

---

## 🧪 Test Case Handling

We explicitly designed flows for:

### ✅ Normal Queries

→ FAQ resolution

### ❌ FAQ Failures

→ `NO_MATCH` → Escalation

### 😡 Negative Sentiment

→ Direct escalation (skips FAQ)

### 🚨 Bad Words / Abuse

→ Immediate escalation

### ⚠️ Threatening Messages

→ High-priority escalation (P1)

### ⏱️ Highly Urgent Cases

→ Fast-tracked to human agents

---

## 🛠️ Tech Stack

* **Orchestration:** n8n
* **LLM:** Groq (GPT-OSS models)
* **Vector DB:** Pinecone
* **Embeddings:** Google Gemini
* **Database:** Supabase (PostgreSQL)
* **Workflow Logic:** IF nodes + Agents

---

## 🏗️ System Flow (Simplified)

```
Webhook
   ↓
Classifier Agent
   ↓
Sentiment Analyzer
   ↓
Decision Layer (IF nodes)
   ├── FAQ Agent → Response → Log
   └── Escalation → Ticket → Supabase → Human
```

---

## 🚀 Future Scope

* 🔹 Full React dashboard for agents
* 🔹 Real-time human replies inside chat
* 🔹 Advanced analytics (ML-based insights)
* 🔹 Multi-language support
* 🔹 Auto-priority learning system
* 🔹 Slack / Email integration for escalations

---

## 🎯 Key Achievements

* ✅ Multi-agent orchestration working end-to-end
* ✅ Intelligent routing (not keyword-based)
* ✅ Real-time sentiment + safety detection
* ✅ RAG-based FAQ resolution
* ✅ Human escalation pipeline
* ✅ Full logging + analytics-ready system

