# Agentic Customer Support System 🤖🎧

---

## 🌟 Project Overview

The **Agentic Customer Support System** is a real-time, multi-agent AI support system that combines **automation + human escalation**.

It is designed to:

* Instantly resolve simple queries
* Intelligently escalate complex or risky cases
* Maintain seamless real-time communication

---

## 🔴 Core Problem

Traditional systems suffer from:

* Slow responses (latency)
* Rigid bots that fail on real-world queries
* High cost of scaling human support

---

## 💡 Solution

A **hybrid AI + human system** with:

* 🤖 AI agents for automation
* 👩‍💻 Human takeover when needed
* ⚡ Real-time messaging (no refresh, no delay)

---

## 🧠 Architecture Overview

### 1. Intake Classifier Agent

* Classifies query:

  * billing, technical, account, refund, shipping, general
* Assigns urgency (low / medium / high)
* Extracts context

---

### 2. Sentiment & Safety Analyzer

* Detects:

  * sentiment (positive → threatening)
  * abusive language
  * urgency signals
* Outputs:

  * `hasBadWords`
  * `isHighlyUrgent`
  * `isThreatening`
  * `escalationReason`

---

### 3. Decision Layer (n8n IF Logic)

Routing rules:

* 🚨 Bad words OR threats → **Immediate escalation**
* ⚠️ Angry + high urgency → **Escalation**
* 📚 Otherwise → **FAQ agent**

---

### 4. FAQ Agent (RAG)

* Uses **Pinecone vector DB**
* Retrieves answers from knowledge base
* If no match → returns `NO_MATCH`

---

### 5. Escalation System

Triggered when:

* Unsafe content
* Negative sentiment
* FAQ failure

Creates a structured escalation entry in database.

---

## ⚡ Real-Time Chat System (KEY FEATURE)

### 🔌 WebSocket-Based (Supabase Realtime)

* Uses **WebSockets (NOT polling)**
* Instant updates:

  * No refresh
  * No waiting
  * No repeated checking

👉 As soon as DB updates → UI updates instantly

---

### 🔁 Automatic Fallback (Reliability Layer)

If realtime fails:

* Internet drops
* Connection breaks
* Supabase realtime not configured

Then system switches to:

➡️ **Polling every 3 seconds**

Ensures:

* No message loss
* System always works

---

## 🔄 Smart Routing Behavior

### 🤖 Normal Flow

```
User → Webhook → n8n → AI → Supabase → UI (realtime)
```

---

### 👩‍💻 Human-in-the-Loop (Bypass Mode)

When escalation happens:

* ❌ n8n is BYPASSED
* ✅ Messages go directly:

```
User ↔ Supabase ↔ Agent
```

👉 This ensures:

* Faster response
* No AI interference
* True real-time human chat

---

## 🧠 Simple Memory System

* Messages stored in **Supabase**
* Sessions stored in **localStorage**
* Messages filtered by **timestamps**

Features:

* Chat history
* Session separation
* Read-only past chats

---

## 🗄️ Database (Supabase)

### Table: `messages`

Stores:

* sender (user / bot / agent / warning / pending_human)
* content
* timestamp

Used for:

* Real-time sync
* Chat rendering
* Agent communication

---

## 👩‍💻 Human Agent System

When escalated:

* Agent panel activates
* Agent can:

  * Reply in real-time
  * Close conversation
* Chat becomes:

  * Direct human support channel

---

## ⚠️ Moderation & Safety

* Detects abusive language
* Issues warnings
* After 2 warnings:

  * Chat is automatically closed

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla JS (custom UI)
* **Backend Orchestration:** n8n
* **LLM:** Groq (GPT-OSS)
* **Vector DB:** Pinecone
* **Embeddings:** Google Gemini
* **Database & Realtime:** Supabase

---

## 🏗️ Actual System Flow

```
User Message
   ↓
Frontend (fetch → webhook)
   ↓
n8n Workflow
   ↓
Classifier → Sentiment → Decision
   ↓
   ├── FAQ → Response → Supabase
   └── Escalation → Supabase (pending_human)
   ↓
Supabase Realtime (WebSocket)
   ↓
Frontend UI Update
```

---

## 🔥 Special Features

* ⚡ Real-time chat (WebSockets)
* 🔁 Polling fallback (fault-tolerant)
* 🔄 Human bypass mode (no AI interference)
* 🧠 Session-based memory
* 🚨 Intelligent escalation system
* 🛡️ Safety + moderation layer

---

## 🚀 Future Scope

* Agent dashboard UI
* Multi-language support
* Analytics dashboards
* Slack / Email integration
* Auto-priority learning

---

## 🎯 Key Achievements

* ✅ Real-time AI + human hybrid system
* ✅ WebSocket-based messaging (no refresh UX)
* ✅ Reliable fallback system
* ✅ Intelligent routing (not keyword-based)
* ✅ Seamless human takeover
* ✅ End-to-end working pipeline

---
