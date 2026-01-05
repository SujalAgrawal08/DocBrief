<div align="center">

# 📘 DocBrief

### Transform Documents into Actionable Intelligence

[![Vite](https://img.shields.io/badge/Vite-7c3aed?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python_3.9+-7c3aed?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-7c3aed?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-7c3aed?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A production-grade AI SaaS application that transforms lengthy PDFs, text files, and scanned images into structured insights using **Generative AI (RAG)** and **Optical Character Recognition (OCR)**.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-a855f7?style=for-the-badge)](https://docbrief.vercel.app)
[![Report Bug](https://img.shields.io/badge/🐛_Report-Bug-6d28d9?style=for-the-badge)](../../issues)
[![Request Feature](https://img.shields.io/badge/✨_Request-Feature-8b5cf6?style=for-the-badge)](../../issues)

---

<img src="assets/DocBrief_Home.png" alt="DocBrief Dashboard" width="80%"/>

<br/><br/>

<img src="assets/DocBrief_Login.png" alt="Login Page" width="80%"/>

</div>

## 🏗️ System Architecture

DocBrief follows a **Decoupled Client-Server Architecture** to ensure scalability and separation of concerns.

- **Frontend (Client)**: Single Page Application (SPA) hosted on Vercel  
- **Backend (Server)**: Containerized Python application hosted on Render  
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

### High-Level System Architecture 

```mermaid
graph LR
    %% Theme Styling
    classDef purple fill:#7e22ce,stroke:#581c87,stroke-width:2px,color:white;
    classDef white fill:#ffffff,stroke:#1f2937,stroke-width:2px,color:#1f2937;
    classDef black fill:#1f2937,stroke:#000000,stroke-width:2px,color:white;

    %% Nodes
    User([👤 User]) 
    FE[🖥️ Frontend<br/>Vercel Edge]
    BE[⚙️ Backend API<br/>Render Container]
    
    %% Branching Services
    DB[(🗄️ Database<br/>Supabase)]
    AI{{🧠 AI Model<br/>Groq Llama 3}}

    %% Connections
    User -->|Upload| FE
    FE -->|JSON Request| BE
    BE -->|SQL Query| DB
    BE -->|Prompt Context| AI

    %% Styling Applications
    class User,FE white;
    class BE purple;
    class DB,AI black;
```

## 🛠️ Tech Stack

| Component  | Technology                    | Role                                                      |
|------------|-------------------------------|-----------------------------------------------------------|
| Frontend   | React.js + Vite               | Core UI library & fast build tool                         |
|            | Tailwind CSS                  | Utility-first styling for responsive design               |
|            | Recharts                      | Data visualization (charts & graphs)                      |
|            | jsPDF                         | Client-side PDF report generation                         |
| Backend    | Python 3.9 + Flask            | API framework                                             |
|            | Docker                        | Containerization (OS-level dependencies)                  |
|            | PyPDF2                        | Native text extraction for PDFs                           |
|            | Tesseract OCR + pytesseract   | Text extraction for images/scanned docs                   |
|            | Groq API                      | Fast inference LLM (Llama 3 8B/70B models)                 |
|            | Flask-Limiter                 | API rate limiting & DDoS protection                       |
| Database   | Supabase (PostgreSQL)         | Storage + Row Level Security (RLS)                        |
| DevOps     | GitHub Actions                | CI/CD automation + Keep-alive scripts                     |

## ⚙️ Key Features & Implementation Logic

### A. Smart Document Processing (OCR & Text Extraction)
**Goal**: Convert any file format (PDF, PNG, JPG) into raw text for the AI.

**How it works**:
- File Type Detection → extension check
- Native PDFs → PyPDF2 (fast & accurate)
- Images/Scanned PDFs → Optimized OCR Pipeline:
  - Preprocessing: Grayscale + resize to max 1200px
  - Extraction: Tesseract v5 via pytesseract
- Code: `app.py → /extract_text` endpoint

### B. RAG-Powered Analysis (Summarization & Insights)
**Goal**: Generate structured intelligence from raw text.

**How it works**:
1. Extracted text sent to backend
2. Strict system prompt enforces JSON output:
   ```json
   {
     "summary": "...",
     "clauses": [...],
     "action_items": [...]
   }
3. Groq API (Llama 3 8B) inference
4. Backend parses & cleans JSON response
* Code: app.py → /analyze_document endpoint

### C. Interactive Context-Aware Chatbot
How it works:
* Frontend sends document text + user question
* Backend injects full document context into prompt
* LLM answers strictly based on provided document only

### D. Analytics Dashboard
* **Complexity Score**: Based on sentence length, vocabulary density, clause count
* Visualization via Recharts (Bar Charts, KPI cards)
* Fully responsive with `<ResponsiveContainer>` fixes

### E. Secure Public Sharing
* Supabase RLS policies allow public SELECT on specific rows
* Dynamic route `/share/:id` renders read-only dashboard
* Owner retains full control (UPDATE/DELETE restricted)

## 🛡️ Security & Scalability Measures
1. **Docker Containerization**
   Custom Dockerfile installs `tesseract-ocr` + `libtesseract-dev` → consistent deployment on Render
2. **API Rate Limiting**
   Flask-Limiter → 10 requests/minute (protects free-tier backend)
3. **CORS Hardening**
   Whitelists only `https://docbrief.vercel.app`
4. **Database & Service Keep-Alive**
   GitHub Action runs daily cron → `hits /keep_alive` endpoint → prevents Supabase pause & keeps Render warm

## 🚀 Deployment Pipeline
Fully automated Continuous Deployment:
1. Push to `master` → GitHub
2. Vercel auto-deploys frontend (Edge Network)
3. Render auto-builds new Docker image & restarts service
4. Live in ~2 minutes

## 📍 Workflow

### Intelligent Extraction Pipeline (OCR Logic)
```mermaid
flowchart TD
    %% Theme Styling
    classDef purple fill:#7e22ce,stroke:#581c87,stroke-width:2px,color:white;
    classDef white fill:#ffffff,stroke:#1f2937,stroke-width:2px,color:#1f2937;
    classDef black fill:#1f2937,stroke:#000000,stroke-width:2px,color:white;

    %% Flow
    Start([📄 Incoming File]) --> Check{Is it PDF?}
    
    %% PDF Path
    Check -- Yes --> PyPDF[📖 PyPDF2 Extraction]
    PyPDF --> Clean[✨ Text Cleaning]

    %% Image Path
    Check -- No (Image) --> Opt1[🎨 Convert to Grayscale]
    Opt1 --> Opt2[Vm Resize to 1200px Max]
    Opt2 --> OCR[👁️ Tesseract OCR Engine]
    OCR --> Clean

    %% Final
    Clean --> JSON[📝 JSON Payload]
    JSON --> End([🚀 Ready for AI Analysis])

    %% Styles
    class Start,Check,Clean,JSON white;
    class PyPDF,Opt1,Opt2,OCR purple;
    class End black;
```

### Automated Maintenance & Keep-Alive Flow

```mermaid
sequenceDiagram
    %% Theme Configuration
    %% Note: Sequence diagrams use specific config objects or themes, 
    %% but we can simulate the look via actor colors in some renderers.
    
    participant GH as 🐙 GitHub Actions (Cron)
    participant BE as ⚙️ Render Backend
    participant DB as 🗄️ Supabase DB

    Note over GH: Every 24 Hours (Midnight UTC)
    
    GH->>BE: GET /keep_alive
    activate BE
    Note right of BE: Wakes up Free Tier Server
    
    BE->>DB: SELECT id FROM documents LIMIT 1
    activate DB
    Note right of DB: Resets 7-Day Inactivity Timer
    
    DB-->>BE: 200 OK (Row Found)
    deactivate DB
    
    BE-->>GH: 200 OK (Status: Alive)
    deactivate BE
```

## 📂 Directory Structure
```bash
DocBrief/
├── frontend/ (Root for Vercel)
│   ├── src/
│   │   ├── components/ (AnalyticsWidget, Chatbot, etc.)
│   │   ├── pages/ (Home, Work, Share)
│   │   ├── apiConfig.js (Dynamic URL logic)
│   │   └── supabaseClient.js
│   └── package.json
│
│── app.py (Main Flask Application)
│── Dockerfile (Container Config)
│── requirements.txt (Python Dependencies)
│── .env (Secrets - Not committed)
└── .github/workflows/
    └── keep-alive.yml (Automation)
```

<div align="center">
Built with ❤️ by Sujal Agrawal

</div> 
