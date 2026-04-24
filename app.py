from flask import Flask, request, jsonify
from typing import Optional
from flask_cors import CORS
from groq import Groq
import os
import json
import time
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from io import BytesIO

from PIL import Image
import pytesseract

from rag_engine import RAGStore

load_dotenv()

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://docbrief.vercel.app", "http://localhost:5173"]}})
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------------------------
# In-memory metrics store (last 50 requests)
# ---------------------------------------------------------------------------
_metrics_log: list[dict] = []
MAX_METRICS = 50


def _log_metrics(endpoint: str, timings: dict):
    """Append timing data for a request to the metrics log."""
    entry = {"endpoint": endpoint, "timestamp": time.time(), **timings}
    _metrics_log.append(entry)
    if len(_metrics_log) > MAX_METRICS:
        _metrics_log.pop(0)


# ---------------------------------------------------------------------------
# In-memory A/B comparison log (last 50 comparisons)
# ---------------------------------------------------------------------------
_comparison_log: list[dict] = []
MAX_COMPARISONS = 50


# --- FALLBACK DATA (The Circuit Breaker) ---
# If AI fails, we return this so the app never crashes during a demo.
MOCK_DATA = {
    "summary": "System Alert: The AI service is currently experiencing high traffic. (Displaying Placeholder) \n\nThis document appears to be a legal agreement or technical specification. It outlines key responsibilities, timelines, and compliance requirements. The primary focus is on data privacy and user obligations.",
    "key_clauses": [
        "Confidentiality: All parties must maintain strict secrecy regarding shared data.",
        "Termination: The agreement can be terminated with 30 days' written notice.",
        "Liability: The service provider is not liable for indirect damages."
    ],
    "obligations": [
        "User must report security breaches within 24 hours.",
        "Payment must be settled by the 5th of every month.",
        "Compliance with local GDPR regulations is mandatory."
    ],
    "actions": [
        {"title": "Contract Renewal", "date": "2025-12-01", "description": "Deadline to renew the service contract."},
        {"title": "Quarterly Review", "date": "2025-11-15", "description": "Scheduled performance review meeting."}
    ]
}
MOCK_COMPARISON = {
    "differences": [
        "Document A allows termination with 30 days notice, while Document B requires 60 days.",
        "Document A includes a non-compete clause; Document B does not.",
        "Document B has a higher penalty for late payments (5%) compared to Document A (2%)."
    ],
    "similarities": [
        "Both documents are valid for a term of 12 months.",
        "Both require binding arbitration for dispute resolution.",
        "Confidentiality clauses are identical in both versions."
    ],
    "verdict": "Document B is more favorable for the Service Provider due to stricter late payment penalties, whereas Document A favors the Client with shorter termination notice."
}


def _build_analysis_prompt(context: str) -> str:
    """Build the analysis prompt for a given context string."""
    return f"""
    Analyze this document context. Return ONLY valid JSON.

    Structure:
    {{
      "summary": "200 word summary...",
      "key_clauses": ["Return a list of ALL critical legal clauses found (e.g., Termination, Liability, Confidentiality, Dispute Resolution)"],
      "obligations": ["obligation 1", "obligation 2", ...],
      "actions": [
         {{"title": "Event Name", "date": "YYYY-MM-DD", "description": "Brief details"}}
      ]
    }}

    Instructions for 'actions':
    - Identify specific deadlines, meeting dates, or due dates.
    - Convert all dates to YYYY-MM-DD format.
    - If no specific dates are found, return an empty array for 'actions'.

    Document text:
    {context}
    """


def _call_groq(prompt: str) -> Optional[str]:
    """Send a prompt to Groq (Llama 3.3) and return raw response."""
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a legal AI assistant. Output strictly JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return None


def analyze_with_groq(context: str) -> Optional[str]:
    """Convenience wrapper for backward compatibility."""
    return _call_groq(_build_analysis_prompt(context))


# ---------------------------------------------------------------------------
# A/B Pipeline Functions
# ---------------------------------------------------------------------------

def baseline_llm_analysis(text: str) -> dict:
    """
    BASELINE approach: send truncated full text directly to LLM.
    No chunking, no embeddings, no retrieval.
    This is the "old" system for comparison.
    """
    truncated = text[:15000]
    input_chars = len(truncated)
    prompt = _build_analysis_prompt(truncated)

    t0 = time.perf_counter()
    raw = _call_groq(prompt)
    llm_ms = round((time.perf_counter() - t0) * 1000, 2)

    result = None
    if raw:
        try:
            clean = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean)
        except json.JSONDecodeError:
            pass

    return {
        "result": result,
        "timings": {
            "llm_ms": llm_ms,
            "total_ms": llm_ms,  # no other stages
            "input_chars": input_chars,
        }
    }


def rag_llm_analysis(text: str) -> dict:
    """
    RAG approach: chunk -> embed -> retrieve Top-K -> send context to LLM.
    This is the current system.
    """
    timings = {}

    try:
        rag_store = RAGStore()
        analysis_query = (
            "key legal clauses, obligations, responsibilities, deadlines, "
            "termination, liability, confidentiality, compliance, penalties, "
            "summary of the document"
        )
        rag_context, rag_timings = rag_store.get_context_for_analysis(
            text, query=analysis_query, top_k=10
        )
        timings.update(rag_timings)
    except Exception as e:
        print(f"RAG Pipeline Error: {e}")
        rag_context = text[:15000]
        timings["rag_fallback"] = True

    input_chars = len(rag_context)
    prompt = _build_analysis_prompt(rag_context)

    t0 = time.perf_counter()
    raw = _call_groq(prompt)
    timings["llm_ms"] = round((time.perf_counter() - t0) * 1000, 2)
    timings["total_ms"] = round(
        timings.get("total_rag_ms", 0) + timings.get("llm_ms", 0), 2
    )
    timings["input_chars"] = input_chars

    result = None
    if raw:
        try:
            clean = raw.replace("```json", "").replace("```", "").strip()
            result = json.loads(clean)
        except json.JSONDecodeError:
            pass

    return {
        "result": result,
        "timings": timings,
    }


# ---------------------------------------------------------------------------
# ENDPOINTS
# ---------------------------------------------------------------------------

@app.route('/', methods=['GET'])
def index():
    """Root endpoint to show the server is running."""
    return jsonify({
        "name": "DocBrief API",
        "status": "online",
        "endpoints": ["/health", "/keep-alive", "/extract_text", "/analyze_document", "/chatbot"]
    })


@app.route('/health', methods=['GET'])
def health():
    """Simple healthcheck endpoint."""
    return jsonify({"status": "ok", "service": "docbrief-backend"})


@app.route('/keep-alive', methods=['GET'])
def keep_alive():
    """
    Prevents Render free-tier cold starts AND Supabase inactivity pauses.
    Makes a minimal (limit=1) REST call to Supabase to reset its inactivity timer.
    """
    import requests
    
    # We grab keys from environment, but fallback gracefully if not set
    # so local development doesn't break.
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    status = {"backend_status": "awake", "supabase_status": "skipped", "timestamp": time.time()}
    
    if supabase_url and supabase_anon_key:
        try:
            headers = {
                "apikey": supabase_anon_key,
                "Authorization": f"Bearer {supabase_anon_key}"
            }
            # Minimal query to keep Postgres awake
            url = f"{supabase_url}/rest/v1/documents?select=id&limit=1"
            t0 = time.perf_counter()
            resp = requests.get(url, headers=headers, timeout=5)
            ping_ms = round((time.perf_counter() - t0) * 1000, 2)
            
            if resp.status_code == 200:
                status["supabase_status"] = "awake"
                status["db_ping_ms"] = ping_ms
            else:
                status["supabase_status"] = f"error_{resp.status_code}"
        except Exception as e:
            status["supabase_status"] = "error_timeout"
            print(f"Keep-alive DB ping failed: {e}")
            
    print(f"Keep-alive triggered: {status}")
    return jsonify(status)


@app.route('/extract_text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        t_start = time.perf_counter()
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1].lower()
        text = ""

        # 1. Handle PDF
        if file_ext == '.pdf':
            reader = PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        # 2. Handle Images (OCR)
        elif file_ext in ['.png', '.jpg', '.jpeg', '.tiff']:
            try:
                image = Image.open(file)
                image = image.convert('L')  # Grayscale for speed

                max_dimension = 1200
                if max(image.size) > max_dimension:
                    image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                custom_config = r'--psm 3'
                text = pytesseract.image_to_string(image, config=custom_config)
            except Exception as e:
                print(f"OCR Error: {e}")
                return jsonify({"error": "Failed to process image. Ensure it is clear."}), 400

        # 3. Handle Text Files
        elif file_ext == '.txt':
            text = file.read().decode('utf-8', errors='ignore')

        else:
            return jsonify({"error": "Unsupported file format."}), 400

        extraction_ms = round((time.perf_counter() - t_start) * 1000, 2)

        if not text.strip():
            return jsonify({"error": "No text found. If this is a scanned PDF, try converting to Image first."}), 400

        _log_metrics("/extract_text", {"extraction_ms": extraction_ms, "text_length": len(text)})
        return jsonify({"text": text, "metrics": {"extraction_ms": extraction_ms}})

    except Exception as e:
        print(f"Error extracting text: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/analyze_document', methods=['POST'])
@limiter.limit("10 per minute")
def analyze_document():
    """
    A/B Comparison Pipeline:
      1. Run BASELINE (full-context truncation → LLM)
      2. Run RAG (chunk → embed → retrieve → LLM)
      3. Measure both, compute reduction percentages
      4. Return RAG result as primary + comparison metrics
    """
    data = request.get_json()
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # --- Run BASELINE pipeline ---
    baseline = baseline_llm_analysis(text)

    # --- Run RAG pipeline ---
    rag = rag_llm_analysis(text)

    # --- Compute A/B comparison ---
    baseline_latency = baseline["timings"]["total_ms"]
    rag_latency = rag["timings"]["total_ms"]
    baseline_input = baseline["timings"]["input_chars"]
    rag_input = rag["timings"]["input_chars"]

    latency_reduction = round(
        ((baseline_latency - rag_latency) / baseline_latency) * 100, 2
    ) if baseline_latency > 0 else 0

    input_reduction = round(
        ((baseline_input - rag_input) / baseline_input) * 100, 2
    ) if baseline_input > 0 else 0

    comparison = {
        "baseline": {
            "latency_ms": baseline_latency,
            "input_chars": baseline_input,
        },
        "rag": {
            "latency_ms": rag_latency,
            "input_chars": rag_input,
            "n_chunks": rag["timings"].get("n_chunks", 0),
            "embedding_ms": rag["timings"].get("embedding_ms", 0),
            "retrieval_ms": rag["timings"].get("retrieval_ms", 0),
        },
        "comparison": {
            "latency_reduction_percent": latency_reduction,
            "input_reduction_percent": input_reduction,
            "rag_is_faster": rag_latency < baseline_latency,
        }
    }

    # Log comparison
    comp_entry = {"timestamp": time.time(), "text_length": len(text), **comparison}
    _comparison_log.append(comp_entry)
    if len(_comparison_log) > MAX_COMPARISONS:
        _comparison_log.pop(0)

    _log_metrics("/analyze_document", rag["timings"])

    # Use RAG result as primary response
    result = rag["result"] if rag["result"] else (
        baseline["result"] if baseline["result"] else MOCK_DATA
    )

    # Attach metrics and comparison
    if isinstance(result, dict):
        result["_metrics"] = rag["timings"]
        result["_comparison"] = comparison

    return jsonify(result)


@app.route('/chatbot', methods=['POST'])
@limiter.limit("20 per minute")
def chatbot():
    """
    RAG-powered chatbot:
      1. Receive user question + full document context
      2. Embed the question
      3. Retrieve Top-5 relevant chunks from document
      4. Send ONLY retrieved chunks + question to Llama-3.3
    """
    data = request.get_json()
    chat_input = data.get("chatInput", "")
    context = data.get("context", "")

    timings = {}

    # --- RAG Retrieval for chatbot ---
    chat_context = context[:10000]  # default fallback
    if context:
        try:
            rag_store = RAGStore()
            build_timings = rag_store.build_index(context)
            timings.update(build_timings)

            retrieved_chunks, query_timings = rag_store.query(chat_input, top_k=5)
            timings.update(query_timings)

            if retrieved_chunks:
                chat_context = "\n\n---\n\n".join(retrieved_chunks)
        except Exception as e:
            print(f"Chatbot RAG Error: {e}")
            # Falls back to truncated context

    try:
        t_llm = time.perf_counter()
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"You are a helpful document assistant. Answer the user's question based ONLY on the following retrieved context:\n\n{chat_context}"},
                {"role": "user", "content": chat_input}
            ],
            model="llama-3.3-70b-versatile",
        )
        reply = chat_completion.choices[0].message.content
        timings["llm_ms"] = round((time.perf_counter() - t_llm) * 1000, 2)
    except Exception as e:
        reply = "I'm having trouble connecting to the brain right now. Please try again."
        print(f"Chatbot Error: {e}")

    _log_metrics("/chatbot", timings)
    return jsonify({"reply": reply, "_metrics": timings})


@app.route('/compare_documents', methods=['POST'])
def compare_documents():
    data = request.get_json()
    text1 = data.get("text1", "")
    text2 = data.get("text2", "")

    if not text1 or not text2:
        return jsonify({"error": "Both documents must be provided."}), 400

    prompt = f"""
    Compare the following two documents. Return ONLY valid JSON.

    Structure:
    {{
        "differences": ["diff 1", "diff 2", "diff 3"],
        "similarities": ["sim 1", "sim 2"],
        "verdict": "A brief conclusion on which document is 'stricter' or 'better' (max 2 sentences)."
    }}

    --- DOCUMENT A ---
    {text1[:7000]}

    --- DOCUMENT B ---
    {text2[:7000]}
    """

    try:
        t_llm = time.perf_counter()
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful analyst. Output strictly JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        raw_response = chat_completion.choices[0].message.content
        llm_ms = round((time.perf_counter() - t_llm) * 1000, 2)

        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(clean_json)
        _log_metrics("/compare_documents", {"llm_ms": llm_ms})
        parsed_data["_metrics"] = {"llm_ms": llm_ms}
        return jsonify(parsed_data)

    except Exception as e:
        print(f"Comparison Error: {e}")
        return jsonify(MOCK_COMPARISON)


@app.route('/metrics', methods=['GET'])
def metrics():
    """Expose recent request timing data for latency analysis."""
    return jsonify({
        "total_logged": len(_metrics_log),
        "requests": _metrics_log
    })


@app.route('/compare_pipelines', methods=['GET'])
def compare_pipelines():
    """Expose A/B comparison history and aggregate stats."""
    if not _comparison_log:
        return jsonify({"message": "No comparisons logged yet.", "comparisons": []})

    # Compute aggregates
    latency_reductions = [c["comparison"]["latency_reduction_percent"] for c in _comparison_log]
    input_reductions = [c["comparison"]["input_reduction_percent"] for c in _comparison_log]

    avg_latency_reduction = round(sum(latency_reductions) / len(latency_reductions), 2)
    avg_input_reduction = round(sum(input_reductions) / len(input_reductions), 2)

    return jsonify({
        "total_comparisons": len(_comparison_log),
        "aggregate": {
            "avg_latency_reduction_percent": avg_latency_reduction,
            "avg_input_reduction_percent": avg_input_reduction,
        },
        "comparisons": _comparison_log
    })


@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded. Please wait a moment."}), 429


if __name__ == '__main__':
    app.run(debug=True)