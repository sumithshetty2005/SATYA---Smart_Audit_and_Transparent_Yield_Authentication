"""Configuration and environment management for Layer 4 Knowledge & GraphRAG Engine."""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Search and load .env from root or backend directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
possible_env_paths = [
    ROOT_DIR / ".env",
    ROOT_DIR / "backend" / ".env",
]
for p in possible_env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=True)

load_dotenv()

# Neo4j Settings
NEO4J_URI = os.getenv("NEO4J_URI", os.getenv("NEO4J_URL", "bolt://localhost:7687"))
NEO4J_USER = os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "") or None

# LLM Providers - Comma-Separated Multi-Key Support
def _parse_keys(env_val: str) -> List[str]:
    """Parse comma-separated list of API keys, trimming whitespace and filtering empty."""
    if not env_val:
        return []
    return [k.strip() for k in env_val.split(",") if k.strip()]

_raw_groq = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEYS: List[str] = _parse_keys(_raw_groq)
GROQ_API_KEY: str = GROQ_API_KEYS[0] if GROQ_API_KEYS else ""
GROQ_MODEL = os.getenv("GROQ_MODEL", "gpt-oss-120b")

_raw_gemini = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
GEMINI_API_KEYS: List[str] = _parse_keys(_raw_gemini)
GEMINI_API_KEY: str = GEMINI_API_KEYS[0] if GEMINI_API_KEYS else ""
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

# Embedding Configuration
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-m3")
EMBEDDING_DIMENSION = 1024

# Chunking & Retrieval Hyperparameters
CHUNK_MIN_TOKENS = 500
CHUNK_MAX_TOKENS = 800
CHUNK_OVERLAP_RATIO = 0.12  # 10% - 15% overlap
RRF_K_CONSTANT = 60
RETRIEVAL_TOP_K = 10
RERANK_TOP_K = 5

# File Paths
KNOWLEDGE_BASE_DIR = ROOT_DIR / "data" / "knowledge_base"
APH_PDF_PATH = KNOWLEDGE_BASE_DIR / "APH_2024_2027.pdf"
CHUNKS_CACHE_PATH = KNOWLEDGE_BASE_DIR / "aph_chunks.json"
