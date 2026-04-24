import os
import sys
import time

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import baseline_llm_analysis, rag_llm_analysis

def generate_sample_document(length: int) -> str:
    """Generates a dummy legal document of approximately `length` characters."""
    base_text = """
    CONFIDENTIALITY AND NON-DISCLOSURE AGREEMENT
    
    This Agreement is entered into by and between the Disclosing Party and the Receiving Party.
    
    1. DEFINITIONS. "Confidential Information" means all information disclosed by the Disclosing Party.
    2. OBLIGATIONS. The Receiving Party shall hold and maintain the Confidential Information in strictest confidence.
    3. TERM. This Agreement shall remain in effect for a period of 5 years.
    4. TERMINATION. Either party may terminate with 30 days written notice.
    5. LIABILITY. The maximum liability shall not exceed $100,000.
    6. GOVERNING LAW. This Agreement shall be governed by the laws of the State of California.
    
    DEADLINE FOR RENEWAL: 2026-12-31
    """
    
    # Repeat the text to reach the desired length
    repeats = max(1, length // len(base_text))
    doc = (base_text * repeats)[:length]
    
    # Ensure some key terms are present for RAG to find
    doc += "\n\nSUMMARY: This is a binding agreement regarding confidentiality."
    return doc

def run_comparison():
    print("======================================================")
    print("   DOCBRIEF A/B EVALUATION: FULL CONTEXT VS RAG")
    print("======================================================\n")
    
    # Document sizes to test (characters)
    # Testing 5K, 10K, 15K, 20K, 30K
    doc_sizes = [5000, 10000, 15000, 20000, 30000]
    
    results = []
    
    for i, size in enumerate(doc_sizes):
        print(f"Testing Document {i+1} (Size: ~{size} chars)...")
        doc_text = generate_sample_document(size)
        
        # We need to ensure Groq API key is set for this to work
        if not os.getenv("GROQ_API_KEY"):
            print("ERROR: GROQ_API_KEY environment variable not set.")
            print("Please set it in the .env file or export it.")
            return

        # Run Baseline (Full Context)
        print("  Running Baseline (Full Context)...", end="", flush=True)
        t0 = time.perf_counter()
        baseline_res = baseline_llm_analysis(doc_text)
        baseline_total_ms = round((time.perf_counter() - t0) * 1000, 2)
        print(f" Done ({baseline_total_ms}ms)")
        
        # Run RAG
        print("  Running RAG Pipeline...", end="", flush=True)
        t0 = time.perf_counter()
        rag_res = rag_llm_analysis(doc_text)
        rag_total_ms = round((time.perf_counter() - t0) * 1000, 2)
        print(f" Done ({rag_total_ms}ms)")
        
        # The internal timings from the functions
        b_timings = baseline_res["timings"]
        r_timings = rag_res["timings"]
        
        # Sometimes network variability makes external timing different from internal timing
        # We'll use the internal timings measured right around the LLM call for accuracy of the LLM overhead
        
        baseline_ms = b_timings["total_ms"]
        rag_ms = r_timings["total_ms"]
        b_chars = b_timings["input_chars"]
        r_chars = r_timings["input_chars"]
        
        lat_red = ((baseline_ms - rag_ms) / baseline_ms) * 100 if baseline_ms > 0 else 0
        inp_red = ((b_chars - r_chars) / b_chars) * 100 if b_chars > 0 else 0
        
        results.append({
            "doc": f"Doc{i+1}",
            "size": size,
            "baseline_ms": baseline_ms,
            "rag_ms": rag_ms,
            "lat_red": lat_red,
            "b_chars": b_chars,
            "r_chars": r_chars,
            "inp_red": inp_red
        })
        
        print(f"  Result: Full={baseline_ms}ms | RAG={rag_ms}ms | Latency Reduction: {lat_red:.1f}%")
        print(f"  Input:  Full={b_chars}c | RAG={r_chars}c | Input Reduction: {inp_red:.1f}%\n")
        
        # Small sleep to respect rate limits
        time.sleep(2)
        
    print("======================================================")
    print("                  FINAL RESULTS")
    print("======================================================")
    
    avg_lat_red = sum(r["lat_red"] for r in results) / len(results)
    avg_inp_red = sum(r["inp_red"] for r in results) / len(results)
    
    for r in results:
        trend = "↓" if r["lat_red"] > 0 else "↑"
        print(f"{r['doc']} (~{r['size']//1000}k chars): Full={r['baseline_ms']}ms | RAG={r['rag_ms']}ms | {trend}{abs(r['lat_red']):.1f}% latency | ↓{r['inp_red']:.1f}% input")
        
    print("-" * 54)
    print(f"Average latency reduction: {avg_lat_red:.1f}%")
    print(f"Average input reduction:   {avg_inp_red:.1f}%")
    print("======================================================")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
    run_comparison()
