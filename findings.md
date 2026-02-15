# 🔍 Findings — TestPlanCreator AI Agent

> **Project:** TestPlanCreator AI Agent  
> **Created:** 2026-02-14  
> **Last Updated:** 2026-02-14

---

## 📚 Research & Discoveries

_This file captures all research, discoveries, constraints, and learnings throughout the project lifecycle._

---

### Phase 0: Initialization

| Date | Category | Finding | Impact |
|------|----------|---------|--------|
| 2026-02-14 | Setup | Project initialized with BLAST protocol | Foundation established |
| 2026-02-14 | Context | Project name: "TestPlanCreator AI Agent" — an AI agent to auto-generate test plans | Defines scope |
| 2026-02-14 | Spec | Full project specification loaded from `prompts/prompt.md` (159 lines) | Complete feature & architecture spec available |

---

### Phase 1: Blueprint (In Progress)

_Discovery Questions answered from `prompts/prompt.md` specification._

- **North Star:** Build a full-stack web app that automates test plan creation by integrating JIRA ticket data with LLM-powered analysis using customizable PDF templates.
- **Integrations:** JIRA REST API v3, Groq API (cloud LLM), Ollama REST API (local LLM). Keys stored in `.env` + encrypted backend storage.
- **Source of Truth:** JIRA tickets (primary), PDF templates (secondary), SQLite (settings/history).
- **Delivery Payload:** Markdown editor/preview in web UI with export to Markdown, PDF, Clipboard. Save to History in SQLite.
- **Behavioral Rules:** LLM acts as "QA Engineer". Must follow template structure, map JIRA details to sections, add scenarios from acceptance criteria. Timeouts: 30s Groq, 120s Ollama. 3 retries with exponential backoff. Never expose API keys in frontend.

| Date | Category | Finding | Impact |
|------|----------|---------|--------|
| 2026-02-14 | Discovery | Full project spec provided in `prompts/prompt.md` | All 5 Discovery Questions answered |
| 2026-02-14 | Architecture | Frontend: React (Vite) + TypeScript + Tailwind CSS + shadcn/ui | UI stack defined |
| 2026-02-14 | Architecture | Backend: Node.js (Express) OR Python (FastAPI) — user choice pending | Backend stack TBD |
| 2026-02-14 | Architecture | Storage: SQLite + File system for templates | Local-first storage |
| 2026-02-14 | Integration | 3 external APIs: JIRA v3, Groq, Ollama | Connectivity scope defined |
| 2026-02-14 | Security | API keys encrypted, CORS localhost-only, input sanitization, PDF size limit <5MB | Security constraints identified |

---

## 🚧 Constraints Discovered

| Constraint | Source | Date |
|------------|--------|------|
| _None yet_ | — | — |

---

## 🔗 Useful Resources

| Resource | URL / Location | Notes |
|----------|---------------|-------|
| _None yet_ | — | — |

---

## 💡 Key Insights

_Insights that influence architectural or design decisions._

1. _None yet — will be populated during Blueprint phase._
