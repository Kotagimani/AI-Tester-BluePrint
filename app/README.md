# 🧪 Intelligent Test Plan Generator

An AI-powered full-stack web application that automates test plan creation by integrating JIRA ticket data with LLM-powered analysis using customizable templates.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **JIRA** API token ([Get one here](https://id.atlassian.com/manage-profile/security/api-tokens))
- **Groq** API key ([Get one here](https://console.groq.com)) OR **Ollama** installed locally

### Installation

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

Copy the example env file and fill in your credentials:

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
```

Or configure everything through the web UI Settings page after starting.

### Running

Open two terminal windows:

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** in your browser.

## 📖 Usage

1. **Configure** — Go to Settings and add your JIRA credentials and LLM provider API keys
2. **Fetch** — Enter a JIRA ticket ID (e.g., `VWO-123`) and click "Fetch Ticket"
3. **Generate** — Select a template and LLM provider, then click "Generate Test Plan"
4. **Export** — Copy, download as Markdown, or save to History

## 🏗️ Architecture

```
app/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── index.js        # Server entry point
│   │   ├── database.js     # SQLite setup
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   └── data/               # SQLite DB (auto-created)
├── frontend/         # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/          # Dashboard, Settings, History
│   │   ├── components/     # Layout, UI components
│   │   └── services/       # API client
```

## 🔒 Security

- API keys are encrypted at rest using AES-256-CBC
- CORS restricted to localhost
- Input validation on all endpoints
- PDF upload limited to 5MB
