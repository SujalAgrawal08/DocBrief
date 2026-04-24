"""
RAG Engine for DocBrief
=======================
Implements a genuine Retrieval-Augmented Generation pipeline:
  1. Chunking  — split document text into overlapping segments
  2. Embedding — encode chunks via sentence-transformers (MiniLM-L6-v2)
  3. Indexing  — store embeddings in a FAISS inner-product index
  4. Retrieval — embed a query and retrieve Top-K relevant chunks

All public methods return timing data (elapsed_ms) for latency analysis.
"""

import time
import numpy as np

# ---------------------------------------------------------------------------
# Lazy-loaded globals (model + FAISS loaded once on first use)
# ---------------------------------------------------------------------------
_model = None
_faiss = None


def _get_model():
    """Lazy-load the sentence-transformer model (≈80 MB download on first run)."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _get_faiss():
    """Lazy-import faiss."""
    global _faiss
    if _faiss is None:
        import faiss as _f
        _faiss = _f
    return _faiss


# ---------------------------------------------------------------------------
# 1. Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split *text* into overlapping character-based chunks.

    Parameters
    ----------
    text : str
        Full document text.
    chunk_size : int
        Target characters per chunk (~100 words at 5 chars/word).
    overlap : int
        Characters shared between consecutive chunks to preserve context.

    Returns
    -------
    list[str]
        Non-empty chunks with leading/trailing whitespace stripped.
    """
    if not text or not text.strip():
        return []

    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


# ---------------------------------------------------------------------------
# 2–4. RAG Store (embed → index → retrieve)
# ---------------------------------------------------------------------------

class RAGStore:
    """
    In-memory vector store backed by FAISS.

    Workflow
    --------
    store = RAGStore()
    timing = store.build_index(document_text)   # chunk + embed + index
    results, timing = store.query("question")   # embed query + retrieve top-K
    """

    def __init__(self):
        self.chunks: list[str] = []
        self.index = None          # faiss.IndexFlatIP
        self.embeddings = None     # np.ndarray (n_chunks × dim)

    # ---- build -----------------------------------------------------------

    def build_index(self, text: str, chunk_size: int = 500, overlap: int = 50) -> dict:
        """
        Chunk text, generate embeddings, and build a FAISS index.

        Returns dict with timing: chunk_ms, embedding_ms, index_ms, total_ms,
        plus n_chunks and embedding_dim.
        """
        faiss = _get_faiss()
        model = _get_model()
        timings: dict = {}

        # --- Chunk ---
        t0 = time.perf_counter()
        self.chunks = chunk_text(text, chunk_size, overlap)
        timings["chunk_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        if not self.chunks:
            return {**timings, "n_chunks": 0, "embedding_dim": 0,
                    "embedding_ms": 0, "index_ms": 0, "total_ms": timings["chunk_ms"]}

        # --- Embed ---
        t1 = time.perf_counter()
        self.embeddings = model.encode(self.chunks, normalize_embeddings=True,
                                       show_progress_bar=False)
        self.embeddings = np.array(self.embeddings, dtype="float32")
        timings["embedding_ms"] = round((time.perf_counter() - t1) * 1000, 2)

        # --- Index (Inner Product on L2-normalised vectors ≡ cosine similarity) ---
        t2 = time.perf_counter()
        dim = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)
        timings["index_ms"] = round((time.perf_counter() - t2) * 1000, 2)

        timings["n_chunks"] = len(self.chunks)
        timings["embedding_dim"] = dim
        timings["total_ms"] = round(sum(v for k, v in timings.items()
                                        if k.endswith("_ms")), 2)
        return timings

    # ---- query -----------------------------------------------------------

    def query(self, query_text: str, top_k: int = 5) -> tuple[list[str], dict]:
        """
        Retrieve the *top_k* most relevant chunks for *query_text*.

        Returns
        -------
        (retrieved_chunks, timings)
            retrieved_chunks : list[str]   — ordered by relevance (best first)
            timings          : dict        — retrieval_ms, query_embedding_ms
        """
        if self.index is None or not self.chunks:
            return [], {"retrieval_ms": 0, "query_embedding_ms": 0}

        model = _get_model()
        timings: dict = {}

        # Embed query
        t0 = time.perf_counter()
        q_emb = model.encode([query_text], normalize_embeddings=True,
                             show_progress_bar=False)
        q_emb = np.array(q_emb, dtype="float32")
        timings["query_embedding_ms"] = round((time.perf_counter() - t0) * 1000, 2)

        # Retrieve
        t1 = time.perf_counter()
        k = min(top_k, len(self.chunks))
        scores, indices = self.index.search(q_emb, k)
        timings["retrieval_ms"] = round((time.perf_counter() - t1) * 1000, 2)

        retrieved = [self.chunks[i] for i in indices[0] if i < len(self.chunks)]
        timings["top_k"] = k
        timings["scores"] = [round(float(s), 4) for s in scores[0][:len(retrieved)]]

        return retrieved, timings

    # ---- convenience -----------------------------------------------------

    def get_context_for_analysis(self, text: str, query: str,
                                 top_k: int = 10,
                                 chunk_size: int = 500,
                                 overlap: int = 50) -> tuple[str, dict]:
        """
        One-shot: build index from *text*, retrieve top-K chunks for *query*,
        return concatenated context string and full timing breakdown.
        """
        build_timings = self.build_index(text, chunk_size, overlap)
        retrieved, query_timings = self.query(query, top_k)
        context = "\n\n---\n\n".join(retrieved)

        all_timings = {**build_timings, **query_timings}
        all_timings["total_rag_ms"] = round(
            build_timings.get("total_ms", 0)
            + query_timings.get("query_embedding_ms", 0)
            + query_timings.get("retrieval_ms", 0), 2
        )
        return context, all_timings
