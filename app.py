from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import pdfplumber
import pytesseract
from PIL import Image
import os
import spacy
import nltk
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

nltk.download("punkt")
nltk.download('punkt_tab')
from nltk.tokenize import sent_tokenize

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}) 


summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

try:
    nlp = spacy.load("en_core_web_sm")  
    blackstone_loaded = True
except Exception as e:
    print(f"Error loading spaCy model: {e}")
    blackstone_loaded = False

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_key_clauses(text):
    sentences = sent_tokenize(text)
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(sentences)
    scores = np.sum(tfidf_matrix.toarray(), axis=1)
    return [sentences[i] for i in np.argsort(scores)[-2:]]  

@app.route('/')
def home():
    return "AI-Powered Legal Document Analyzer is running!"

@app.route('/summarize', methods=['POST', 'OPTIONS'])
def summarize_text():
    if request.method == 'OPTIONS':
        return _cors_preflight_response()

    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        summary = summarizer(text, max_length=500, min_length=200, do_sample=False)
        return jsonify({"summary": summary[0]["summary_text"]})
    except Exception as e:
        return jsonify({"error": f"Summarization failed: {str(e)}"}), 500

@app.route('/extract_text', methods=['POST', 'OPTIONS'])
def extract_text():
    if request.method == 'OPTIONS':
        return _cors_preflight_response()

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filename)

    extracted_text = ""
    try:
        if file.filename.lower().endswith('.pdf'):
            with pdfplumber.open(filename) as pdf:
                extracted_text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
        elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image = Image.open(filename)
            extracted_text = pytesseract.image_to_string(image)
        else:
            return jsonify({"error": "Unsupported file type"}), 400
    except Exception as e:
        return jsonify({"error": f"File processing failed: {str(e)}"}), 500
    finally:
        os.remove(filename)

    return jsonify({"text": extracted_text})

@app.route('/analyze_legal_text', methods=['POST', 'OPTIONS'])
def analyze_legal_text():
    if request.method == 'OPTIONS':
        return _cors_preflight_response()

    if not blackstone_loaded:
        return jsonify({"error": "spaCy model not loaded"}), 500

    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    doc = nlp(text)
    obligations = [token.text for token in doc if token.dep_ in ["obl", "nsubjpass"]]

    key_clauses = extract_key_clauses(text)

    return jsonify({
        "obligations": obligations,
        "key_clauses": key_clauses
    })

@app.route('/extract_clauses', methods=['POST', 'OPTIONS'])
def extract_clauses():
    """New route for extracting key clauses only"""
    if request.method == 'OPTIONS':
        return _cors_preflight_response()

    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "No text provided"}), 400

    key_clauses = extract_key_clauses(text)
    return jsonify({"key_clauses": key_clauses})

def _cors_preflight_response():
    """Handles CORS preflight requests"""
    response = jsonify({"message": "CORS preflight successful"})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    return response

if __name__ == '__main__':
    app.run(debug=True)
