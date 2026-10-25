"""Layer 4: Agentic GraphRAG & Regulatory Engine.

Provides structure-aware chunking, Neo4j knowledge graph seeding, hybrid BM25 + BGE-M3
retrieval, RRF ranking, controlled graph traversal, evidence provenance validation,
and LangGraph multi-agent compliance evaluation.
"""

from app.knowledge.agent import execute_compliance_audit, compliance_agent_graph
from app.knowledge.embeddings import BGEM3EmbeddingManager, embedding_manager
from app.knowledge.ingest_aph import APHChunk, StructureAwareChunker, ingest_aph_document
from app.knowledge.reranker import EvidenceReranker, reranker
from app.knowledge.retriever import HybridGraphRetriever, retriever
from app.knowledge.seed_graph import (
    InMemoryKnowledgeGraph,
    Neo4jKnowledgeGraphSeeder,
    graph_seeder,
    in_memory_graph,
    seed_graph_database,
)

__all__ = [
    "execute_compliance_audit",
    "compliance_agent_graph",
    "BGEM3EmbeddingManager",
    "embedding_manager",
    "APHChunk",
    "StructureAwareChunker",
    "ingest_aph_document",
    "EvidenceReranker",
    "reranker",
    "HybridGraphRetriever",
    "retriever",
    "InMemoryKnowledgeGraph",
    "Neo4jKnowledgeGraphSeeder",
    "graph_seeder",
    "in_memory_graph",
    "seed_graph_database",
]
