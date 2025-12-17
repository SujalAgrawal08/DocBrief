from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import os
import json
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from io import BytesIO

from PIL import Image  # <--- NEW
import pytesseract     # <--- NEW
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

def analyze_with_groq(text):
    """
    Uses Groq (Llama 3.3) for ultra-fast analysis.
    """
    prompt = f"""
    Analyze this document. Return ONLY valid JSON.

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

    Text: {text[:15000]}
    """

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

@app.route('/extract_text', methods=['POST'])
def extract_text():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
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
        
        # 2. Handle Images (OCR) - NOW SUPPORTED
        elif file_ext in ['.png', '.jpg', '.jpeg', '.tiff']:
            try:
                # Load image from memory
                image = Image.open(file)
                # Convert to RGB (fixes issues with some PNGs)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Resize if image is huge (limit to 1800px max dimension)
                # This drastically reduces RAM usage and processing time
                max_dimension = 1800
                if max(image.size) > max_dimension:
                    image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
                    
                text = pytesseract.image_to_string(image)
            except Exception as e:
                print(f"OCR Error: {e}")
                return jsonify({"error": "Failed to process image. Ensure it is clear."}), 400

        # 3. Handle Text Files
        elif file_ext == '.txt':
            text = file.read().decode('utf-8', errors='ignore')
            
        else:
            return jsonify({"error": "Unsupported file format."}), 400

        # Final check
        if not text.strip():
            return jsonify({"error": "No text found. If this is a scanned PDF, try converting to Image first."}), 400

        return jsonify({"text": text})

    except Exception as e:
        print(f"Error extracting text: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze_document', methods=['POST'])
@limiter.limit("10 per minute")
def analyze_document():
    data = request.get_json()
    text = data.get("text", "")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    # 1. Try Groq API
    raw_response = analyze_with_groq(text)
    
    # 2. Parse Response
    if raw_response:
        try:
            # Clean potential markdown wrappers
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_json)
            return jsonify(parsed_data)
        except json.JSONDecodeError:
            print("Failed to parse JSON from AI.")
    
    # 3. Circuit Breaker (Fallback)
    # If API failed or JSON failed, return MOCK DATA so User UI shows something.
    print("Triggering Circuit Breaker (Mock Data)")
    return jsonify(MOCK_DATA)

@app.route('/chatbot', methods=['POST'])
@limiter.limit("20 per minute")
def chatbot():
    data = request.get_json()
    chat_input = data.get("chatInput", "")
    context = data.get("context", "")
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"Context: {context[:10000]}. Answer briefly."},
                {"role": "user", "content": chat_input}
            ],
            # UPDATED MODEL NAME HERE
            model="llama-3.3-70b-versatile",
        )
        reply = chat_completion.choices[0].message.content
    except Exception as e:
        reply = "I'm having trouble connecting to the brain right now. Please try again."
        print(f"Chatbot Error: {e}")
        
    return jsonify({"reply": reply})

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({"error": "Rate limit exceeded. Please wait a moment."}), 429

@app.route('/compare_documents', methods=['POST'])
def compare_documents():
    data = request.get_json()
    text1 = data.get("text1", "")
    text2 = data.get("text2", "")

    if not text1 or not text2:
        return jsonify({"error": "Both documents must be provided."}), 400

    # Prompt for comparison
    # We truncate both texts to ~7000 chars to fit within context limits safely
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
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful analyst. Output strictly JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        raw_response = chat_completion.choices[0].message.content

        # Clean and Parse
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(clean_json)
        return jsonify(parsed_data)

    except Exception as e:
        print(f"Comparison Error: {e}")
        # Fallback
        return jsonify(MOCK_COMPARISON)

if __name__ == '__main__':
    app.run(debug=True)