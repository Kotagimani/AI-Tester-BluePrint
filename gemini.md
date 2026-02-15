# 📜 Project Constitution — TestPlanCreator AI Agent

> **This file is LAW.** All system behavior, data schemas, and architectural decisions are governed by this document.  
> **Created:** 2026-02-14  
> **Last Updated:** 2026-02-14  
> **Status:** 🟡 Awaiting Blueprint Approval

---

## 🎯 Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | TestPlanCreator AI Agent |
| **Protocol** | B.L.A.S.T. (Blueprint, Link, Architect, Stylize, Trigger) |
| **Architecture** | A.N.T. 3-Layer (Architecture → Navigation → Tools) |
| **Language** | TBD (Python expected) |
| **Current Phase** | Phase 0 — Initialization |

---

## 📐 Data Schemas

> ✅ **CONFIRMED** — Schemas defined on 2026-02-14. Backend: Node.js (Express).

### JIRA Ticket Schema (Input)

```json
{
  "ticketId": "string (e.g. VWO-123)",
  "summary": "string",
  "description": "string (HTML/markdown)",
  "priority": "string (e.g. High, Medium, Low)",
  "status": "string (e.g. Open, In Progress)",
  "assignee": "string",
  "labels": ["string"],
  "acceptanceCriteria": "string",
  "attachments": [{ "filename": "string", "url": "string" }]
}
```

### Template Schema

```json
{
  "id": "number (auto-increment)",
  "name": "string",
  "filename": "string",
  "content": "string (extracted text from PDF)",
  "createdAt": "ISO 8601 timestamp"
}
```

### Test Plan Output Schema (Payload)

```json
{
  "id": "number (auto-increment)",
  "ticketId": "string",
  "ticketSummary": "string",
  "templateId": "number | null",
  "content": "string (markdown)",
  "provider": "groq | ollama",
  "model": "string",
  "createdAt": "ISO 8601 timestamp",
  "metadata": {
    "tokensUsed": "number",
    "generationTimeMs": "number"
  }
}
```

### Settings Schema

```json
{
  "jira": {
    "baseUrl": "string (e.g. https://company.atlassian.net)",
    "username": "string (email)",
    "apiToken": "string (encrypted at rest)"
  },
  "llm": {
    "provider": "groq | ollama",
    "groq": {
      "apiKey": "string (encrypted at rest)",
      "model": "string (e.g. llama3-70b-8192)",
      "temperature": "number (0-1, default 0.3)"
    },
    "ollama": {
      "baseUrl": "string (default http://localhost:11434)",
      "model": "string"
    }
  }
}
```

### API Endpoints

```
POST /api/settings/jira        → Save JIRA credentials
GET  /api/settings/jira/test   → Test JIRA connection
POST /api/settings/llm         → Save LLM config
GET  /api/settings/llm/models  → List Ollama models
GET  /api/settings              → Get all settings

POST /api/jira/fetch           → Fetch ticket { ticketId }
GET  /api/jira/recent          → Recent fetched tickets

POST /api/testplan/generate    → Generate { ticketId, templateId, provider }
GET  /api/testplan/history     → History list
GET  /api/testplan/:id         → Single test plan

POST /api/templates/upload     → Upload PDF (multipart)
GET  /api/templates            → List templates
DELETE /api/templates/:id      → Delete template
```

---

## 📏 Behavioral Rules

> Rules that govern how the system must "act." These are inviolable.

1. **Reliability over Speed** — Never guess at business logic. Deterministic outputs only.
2. **Data-First** — No coding until the payload shape is confirmed.
3. **Self-Healing** — On failure: Analyze → Patch → Test → Update Architecture.
4. **SOP Before Code** — If logic changes, update the architecture SOP before the code.
5. _Additional rules TBD after Discovery Questions are answered._

---

## 🏛️ Architectural Invariants

| Invariant | Description |
|-----------|-------------|
| **3-Layer Separation** | Architecture (SOPs) ↔ Navigation (Decisions) ↔ Tools (Execution) |
| **Atomic Tools** | Each tool in `tools/` does ONE thing and is independently testable |
| **No Secrets in Code** | All API keys/tokens stored in `.env` only |
| **Temp Files in `.tmp/`** | All intermediate/ephemeral data goes in `.tmp/` |
| **gemini.md is Law** | All schema/rule changes must be reflected here first |

---

## 🔌 Integrations

| Service | Purpose | Status | API Key Location |
|---------|---------|--------|-----------------|
| _TBD_ | _Awaiting Discovery_ | 🔴 Not configured | `.env` |

---

## 📋 Maintenance Log

| Date | Change | Reason | Phase |
|------|--------|--------|-------|
| 2026-02-14 | Initial creation of Project Constitution | Phase 0 Initialization | Phase 0 |

---

## 🚫 Do Not Rules

_Explicit prohibitions for this system. Added during Blueprint phase._

1. Do NOT write code before the Blueprint is approved.
2. Do NOT hardcode API keys or secrets.
3. Do NOT skip the self-annealing repair loop on errors.
4. _More rules TBD..._
