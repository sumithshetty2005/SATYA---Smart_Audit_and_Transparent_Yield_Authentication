"""Configuration and environment management for Layer 4 Knowledge & GraphRAG Engine."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Automatically load .env if present
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
dotenv_path = ROOT_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv()

# Neo4j Settings
NEO4J_URI = os.getenv("NEO4J_URI", os.getenv("NEO4J_URL", "bolt://localhost:7687"))
NEO4J_USER = os.getenv("NEO4J_USER", os.getenv("NEO4J_USERNAME", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

# LLM Providers
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

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
