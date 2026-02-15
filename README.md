# 🚀 AI Test Plan Creator Agent

```mermaid
flowchart TB
    subgraph Client ["Frontend (React/Vite)"]
        UI[User Interface]
        API_Service[API Service Layer]
        State[React State & Context]
    end

    subgraph Server ["Backend (Node.js/Express)"]
        Router[Express Router]
        Controllers[Controllers]
        
        subgraph Services
            JiraService[JIRA Service]
            GroqService[Groq LLM Service]
            OllamaService[Ollama LLM Service]
        end
        
        subgraph Data ["Data Layer"]
            SQLite[(SQLite Database)]
            Encryption[Encryption Utils]
        end
    end

    subgraph External ["External Services"]
        JIRA_API[Atlassian JIRA API]
        Groq_API[Groq Cloud API]
        Ollama_Local[Local Ollama Instance]
    end

    %% Frontend Interactions
    UI -->|User Actions| State
    State -->|Requests| API_Service
    API_Service -->|HTTP/JSON| Router

    %% Backend Flow
    Router -->|Route Handling| Controllers
    Controllers -->|Business Logic| Services
    
    %% Service Integrations
    JiraService -->|Fetch Tickets| JIRA_API
    GroqService -->|Generate Plan| Groq_API
    OllamaService -->|Generate Plan| Ollama_Local
    
    %% Data Persistence
    Controllers -->|Read/Write| SQLite
    SQLite <-->|Encrypt/Decrypt| Encryption
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef external fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class UI,API_Service,State frontend;
    class Router,Controllers,JiraService,GroqService,OllamaService backend;
    class JIRA_API,Groq_API,Ollama_Local external;
    class SQLite,Encryption database;
```

An intelligent agent that drastically reduces the time QA engineers spend on test planning. By integrating directly with **JIRA** and leveraging powerful **Large Language Models (LLMs)** like Groq (Llama 3) and Ollama, this tool automatically generates comprehensive, professional test plans from JIRA ticket details.

## ✨ Key Features

-   **🔌 JIRA Integration**: Seamlessly fetch ticket details (Description, Acceptance Criteria, Priority) directly from your JIRA instance.
-   **🧠 AI-Powered Generation**:
    -   **Cloud**: Ultra-fast generation using Groq (Llama 3 70B).
    -   **Local**: Privacy-focused generation using Ollama (Llama 3, Mistral, etc.).
-   **📝 Custom Templates**: Upload your own PDF templates to ensure test plans match your organization's specific format.
-   **⚡ Modern UI**: sleek, responsive dashboard built with React, Vite, and Tailwind CSS.
-   **💾 History & Management**: Save, view, and manage previously generated test plans.
-   **🔒 Secure**: API keys and tokens are encrypted at rest using SQLite.

## 🛠️ Tech Stack

### Frontend
-   **React 18**
-   **Vite**
-   **Tailwind CSS**
-   **Typescript**
-   **Lucide React** (Icons)

### Backend
-   **Node.js**
-   **Express**
-   **SQLite** (Data persistence)
-   **Better-SQLite3**

### AI & Services
-   **Groq SDK**
-   **Ollama**
-   **JIRA REST API**

## 🚀 Getting Started

### Prerequisites
-   Node.js (v16+)
-   npm or yarn
-   A JIRA account (for fetching tickets)
-   (Optional) Groq API Key
-   (Optional) Ollama installed locally

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Kotagimani/AI-Tester-BluePrint.git
    cd AI-Tester-BluePrint/Project1-TestPlanCreator_AI_Agent
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd app/backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd app/frontend
    npm install
    ```

4.  **Start the Application**
    You need to run both the backend and frontend.

    *Terminal 1 (Backend):*
    ```bash
    cd app/backend
    npm start
    ```

    *Terminal 2 (Frontend):*
    ```bash
    cd app/frontend
    npm run dev
    ```

5.  **Open in Browser**
    Navigate to `http://localhost:3000`

## ⚙️ Configuration

1.  **Go to Settings** in the application.
2.  **JIRA**: Enter your JIRA Base URL, Username, and API Token.
3.  **LLM Provider**:
    -   Select **Groq** and enter your API Key for fast, cloud-based generation.
    -   Select **Ollama** and ensure your local Ollama instance is running (default: `http://localhost:11434`).

## 📸 Screenshots

*(Add screenshots of validity here)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
