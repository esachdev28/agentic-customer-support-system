# Agentic Customer Support Dashboard

A professional, real-time analytics and monitoring dashboard designed as the control center for the **Agentic Customer Support System**. This dashboard provides visibility into the multi-agent orchestration, sentiment trends, and human escalation pipelines powered by n8n, Supabase, and Groq.

![Dashboard Preview](https://github.com/esachdev28/agentic-customer-support-company-dashboard/raw/main/src/assets/hero.png)

## 🚀 Features

- **System-Wide Analytics**: Monitor the performance of the entire multi-agent pipeline, including the Intake Classifier and FAQ agents.
- **Real-time Metrics**: Live updates of conversation counts and sender types (User, Bot, Agent, Escalations) via Supabase WebSockets.
- **Sentiment Monitoring**: Visualize the output of the Sentiment & Safety Analyzer to track customer satisfaction and identify urgent escalations.
- **Resolution Tracking**: Analyze the effectiveness of the FAQ (RAG) agent vs. human interventions.
- **Conversation Logs**: A live, filterable feed of all support messages, including those bypassed for human-in-the-loop support.
- **Interactive Charts**:
  - **Volume Trends**: Message volume over time using `Recharts`.
  - **Sender Distribution**: Visual breakdown of how queries are handled (Bot vs. Agent vs. Escalation).

## 🛠️ Tech Stack & Ecosystem

This dashboard is the monitoring layer of the **Agentic Customer Support System**, integrating with:
- **Core Intelligence**: n8n (Orchestration), Groq (LLM), Pinecone (Vector DB), and Google Gemini (Embeddings).
- **Backend/Real-time**: [Supabase](https://supabase.com/) (Postgres + Realtime WebSockets).
- **Frontend**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/).
- **Visualization**: [Recharts](https://recharts.org/) & [Tailwind CSS 3](https://tailwindcss.com/).

## 📁 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx    # Main metrics and analytics view
│   │   ├── Sentiment.jsx    # Sentiment analysis visualization
│   │   ├── Resolution.jsx   # Ticket resolution performance
│   │   └── Layout.jsx       # Global sidebar and navigation wrapper
│   ├── assets/              # Static assets and images
│   ├── supabaseClient.js    # Supabase connection configuration
│   ├── App.jsx              # Main routing and page state management
│   ├── main.jsx             # React application entry point
│   └── index.css            # Global styles and Tailwind imports
├── public/                  # Static assets (icons, favicons)
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite build configuration
└── package.json             # Project dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites
- Node.js 22.0.0 or higher
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/esachdev28/agentic-customer-support-company-dashboard.git
   cd agentic-customer-support-company-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173/`.

### Deployment

To build the project for production:
```bash
npm run build
```
The output will be in the `dist/` directory, ready to be hosted on Vercel, Netlify, or any static hosting service.

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.

---
Built with ❤️ for Agentic Support Teams.
