<div align="center">
  
# 📘 DocBrief v2.0 – Technical Documentation

DocBrief is a production-grade AI SaaS application designed to streamline document analysis. It transforms lengthy PDFs, text files, and scanned images into structured insights using Generative AI (RAG) and Optical Character Recognition (OCR).

</div>
## 🏗️ 1. System Architecture

DocBrief follows a **Decoupled Client-Server Architecture** to ensure scalability and separation of concerns.

- **Frontend (Client)**: Single Page Application (SPA) hosted on Vercel  
- **Backend (Server)**: Containerized Python application hosted on Render  
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)

**High-Level Data Flow**  
`User Upload → Frontend → Backend API → OCR Engine / LLM → Database → Frontend Visualization`

## 🛠️ 2. Tech Stack

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

## ⚙️ 3. Key Features & Implementation Logic

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
