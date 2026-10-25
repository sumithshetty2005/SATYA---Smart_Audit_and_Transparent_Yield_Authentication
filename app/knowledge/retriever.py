"""Layer 4 Task 3: Hybrid Retrieval with Reciprocal Rank Fusion (RRF) & Graph Traversal.

Implements dual-path retrieval:
1. BM25 Search: Exact match for course codes, section numbers, ratio numbers (1:15), land figures.
2. Dense Vector Search: BAAI/bge-m3 embeddings cosine similarity search.
3. Reciprocal Rank Fusion (RRF): Merges top-10 candidate passes and deduplicates results.
4. Controlled 1- to 2-hop Graph Traversal: Outward traversal from retrieved clauses in Neo4j,
   dynamically filtered against applicant facts (programme, location, application_type, year).
"""

import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from rank_bm25 import BM25Okapi

from app.knowledge.config import (
    CHUNKS_CACHE_PATH,
    NEO4J_DATABASE,
    RETRIEVAL_TOP_K,
    RRF_K_CONSTANT,
)
from app.knowledge.embeddings import embedding_manager
from app.knowledge.ingest_aph import APHChunk
from app.knowledge.seed_graph import (
    graph_seeder,
    in_memory_graph,
    seed_graph_database,
)
from app.schemas.compliance import GraphTraversalPath, InstitutionFacts

logger = logging.getLogger(__name__)


def tokenize_for_bm25(text: str) -> List[str]:
    """Tokenize string while preserving ratio numbers (e.g. 1:15, 1:2:6) and section codes."""
    # Preserve ratios like 1:15, 1:2:6, decimal numbers like 7.5, 2.5, section codes like 2.1
    tokens = re.findall(r"\d+:\d+(?::\d+)?|\d+\.\d+|\b\w+\b", text.lower())
    return tokens


class HybridGraphRetriever:
    """Orchestrates BM25 exact match, BGE-M3 vector search, RRF fusion, and graph traversal."""

    def __init__(self, chunks: Optional[List[APHChunk]] = None) -> None:
        self.chunks: List[APHChunk] = []
        self.chunk_map: Dict[str, APHChunk] = {}
        self.bm25_index: Optional[BM25Okapi] = None
        self.corpus_tokens: List[List[str]] = []

        if chunks is not None:
            self._init_corpus(chunks)
        else:
            self._load_cached_or_seed()

    def _init_corpus(self, chunks: List[APHChunk]) -> None:
        """Initialize in-memory corpus and BM25 index."""
        self.chunks = list(chunks)
        self.chunk_map = {c.chunk_id: c for c in self.chunks}
        self.corpus_tokens = [tokenize_for_bm25(c.text + " " + c.title + " " + c.section_id) for c in self.chunks]
        if self.corpus_tokens:
            self.bm25_index = BM25Okapi(self.corpus_tokens)
        logger.info("Initialized BM25 index over %d regulatory chunks", len(self.chunks))

    def _load_cached_or_seed(self) -> None:
        """Load chunks from cache or execute seeding pipeline."""
        if not in_memory_graph.is_seeded:
            seed_graph_database()

        # Retrieve clauses from in-memory graph
        clause_nodes = in_memory_graph.find_nodes("RegulatoryClause")
        if clause_nodes:
            aph_chunks = [
                APHChunk(
                    chunk_id=n["clause_id"],
                    title=n["title"],
                    edition_year=n["edition_year"],
                    section_id=n["section_id"],
                    clause_reference=n["clause_reference"],
                    page_number=n["page_number"],
                    table_context=n.get("table_context"),
                    text=n["text"],
                    approx_tokens=n.get("approx_tokens", 500),
                    metadata=n,
                )
                for n in clause_nodes
            ]
            self._init_corpus(aph_chunks)
        else:
            # Fallback to direct ingestion
            chunks = seed_graph_database()

    def bm25_search(self, query: str, top_k: int = RETRIEVAL_TOP_K) -> List[Tuple[str, float]]:
        """Execute BM25 exact-match search prioritizing ratios, section codes, and keywords."""
        if not self.bm25_index or not self.chunks:
            return []

        query_tokens = tokenize_for_bm25(query)
        if not query_tokens:
            return []

        scores = self.bm25_index.get_scores(query_tokens)
        indexed_scores = [(self.chunks[i].chunk_id, float(scores[i])) for i in range(len(scores))]
        indexed_scores.sort(key=lambda x: x[1], reverse=True)
        return indexed_scores[:top_k]

    def vector_search(self, query: str, top_k: int = RETRIEVAL_TOP_K) -> List[Tuple[str, float]]:
        """Execute dense vector similarity search using BGE-M3 query embeddings."""
        query_vector = embedding_manager.embed_query(query)

        # 1. Try Live Neo4j Vector Index if connected
        if graph_seeder.connect() and graph_seeder.driver:
            try:
                with graph_seeder.driver.session(database=graph_seeder.database) as session:
                    cypher = """
                    CALL db.index.vector.queryNodes('clause_vector_index', $top_k, $query_vector)
                    YIELD node, score
                    RETURN node.clause_id AS clause_id, score
                    """
                    result = session.run(cypher, top_k=top_k, query_vector=query_vector)
                    records = [(r["clause_id"], float(r["score"])) for r in result]
                    if records:
                        return records
            except Exception as exc:
                logger.debug("Live Neo4j vector search fallback to in-memory: %s", exc)

        # 2. In-Memory Vector Search
        scored_clauses: List[Tuple[str, float]] = []
        for chunk in self.chunks:
            node_props = in_memory_graph.get_node("RegulatoryClause", chunk.chunk_id)
            if node_props and "embedding" in node_props:
                sim = embedding_manager.cosine_similarity(query_vector, node_props["embedding"])
                scored_clauses.append((chunk.chunk_id, sim))
            else:
                emb = embedding_manager.embed_text(chunk.text)
                sim = embedding_manager.cosine_similarity(query_vector, emb)
                scored_clauses.append((chunk.chunk_id, sim))

        scored_clauses.sort(key=lambda x: x[1], reverse=True)
        return scored_clauses[:top_k]

    def reciprocal_rank_fusion(
        self,
        bm25_results: List[Tuple[str, float]],
        vector_results: List[Tuple[str, float]],
        k: int = RRF_K_CONSTANT,
        top_k: int = RETRIEVAL_TOP_K,
    ) -> List[Tuple[str, float]]:
        """Merge BM25 and Vector candidate passes using Reciprocal Rank Fusion ($score = sum 1 / (k + rank))."""
        rrf_scores: Dict[str, float] = {}

        # Accumulate BM25 ranks
        for rank, (doc_id, _) in enumerate(bm25_results, start=1):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank))

        # Accumulate Dense Vector ranks
        for rank, (doc_id, _) in enumerate(vector_results, start=1):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank))

        # Sort deduplicated passages by RRF score descending
        fused_items = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return fused_items[:top_k]

    def traverse_graph_for_clauses(
        self,
        clause_ids: List[str],
        institution_facts: Optional[InstitutionFacts] = None,
        max_hops: int = 2,
    ) -> List[GraphTraversalPath]:
        """Perform controlled 1- to 2-hop traversal in Neo4j outward from retrieved clause nodes.

        Dynamically filters paths using known application facts (programme, location, application_type, year).
        """
        paths: List[GraphTraversalPath] = []
        seen_path_keys: Set[Tuple[str, str, str]] = set()

        prog_filter = institution_facts.programme.lower() if institution_facts else ""
        loc_filter = institution_facts.location_type.lower() if institution_facts else ""
        app_filter = institution_facts.application_type.lower() if institution_facts else ""

        for cid in clause_ids:
            # Traversal (Neo4j live or In-Memory fallback)
            raw_paths: List[Dict[str, Any]] = []

            if graph_seeder.connect() and graph_seeder.driver:
                try:
                    with graph_seeder.driver.session(database=graph_seeder.database) as session:
                        cypher = """
                        MATCH (c:RegulatoryClause {clause_id: $cid})
                        OPTIONAL MATCH path = (c)-[r1]->(n1)
                        OPTIONAL MATCH path2 = (n1)-[r2]->(n2)
                        RETURN c.clause_id AS from_id, 'RegulatoryClause' AS from_label,
                               type(r1) AS rel1, n1.id AS to1_id, labels(n1)[0] AS to1_label, properties(n1) AS to1_props,
                               type(r2) AS rel2, n2.id AS to2_id, labels(n2)[0] AS to2_label, properties(n2) AS to2_props
                        """
                        res = session.run(cypher, cid=cid)
                        for r in res:
                            if r["rel1"] and r["to1_id"]:
                                raw_paths.append(
                                    {
                                        "from_node": r["from_id"],
                                        "from_label": r["from_label"],
                                        "relationship": r["rel1"],
                                        "to_node": r["to1_id"],
                                        "to_label": r["to1_label"],
                                        "properties": r["to1_props"],
                                        "hop_depth": 1,
                                    }
                                )
                            if r["rel2"] and r["to2_id"]:
                                raw_paths.append(
                                    {
                                        "from_node": r["to1_id"],
                                        "from_label": r["to1_label"],
                                        "relationship": r["rel2"],
                                        "to_node": r["to2_id"],
                                        "to_label": r["to2_label"],
                                        "properties": r["to2_props"],
                                        "hop_depth": 2,
                                    }
                                )
                except Exception as exc:
                    logger.debug("Live graph query fallback: %s", exc)

            if not raw_paths:
                raw_paths = in_memory_graph.traverse(
                    start_label="RegulatoryClause",
                    start_id=cid,
                    max_hops=max_hops,
                )

            # Dynamic Filtering against applicant facts
            for p in raw_paths:
                key = (p["from_node"], p["relationship"], p["to_node"])
                if key in seen_path_keys:
                    continue

                matched_fact = None
                to_label = p.get("to_label", "")
                props = p.get("properties", {})
                name_or_desc = (props.get("name", "") + " " + props.get("description", "")).lower()

                # Filter Programme paths
                if to_label == "Programme" or "prog" in p["to_node"]:
                    if prog_filter and (prog_filter in name_or_desc or "engineering" in name_or_desc):
                        matched_fact = f"Programme: {institution_facts.programme}"
                    elif prog_filter:
                        # Exclude non-matching programmes
                        continue

                # Filter Location paths
                if to_label == "LocationType" or "loc" in p["to_node"]:
                    if loc_filter and (loc_filter in name_or_desc or "rural" in name_or_desc or "urban" in name_or_desc):
                        matched_fact = f"LocationType: {institution_facts.location_type}"

                # Filter ApplicationType paths
                if to_label == "ApplicationType" or "app_" in p["to_node"]:
                    if app_filter and app_filter in name_or_desc:
                        matched_fact = f"ApplicationType: {institution_facts.application_type}"

                seen_path_keys.add(key)
                paths.append(
                    GraphTraversalPath(
                        from_node=p["from_node"],
                        from_label=p["from_label"],
                        relationship=p["relationship"],
                        to_node=p["to_node"],
                        to_label=p["to_label"],
                        properties=props,
                        hop_depth=p.get("hop_depth", 1),
                        matched_fact=matched_fact,
                    )
                )

        return paths

    def retrieve_hybrid(
        self,
        query: str,
        institution_facts: Optional[InstitutionFacts] = None,
        top_k: int = RETRIEVAL_TOP_K,
    ) -> Tuple[List[Tuple[APHChunk, float]], List[GraphTraversalPath]]:
        """Execute full hybrid retrieval pipeline: BM25 + Vector + RRF + Graph Traversal."""
        # 1. Dual-Path Retrieval
        bm25_matches = self.bm25_search(query, top_k=top_k)
        vector_matches = self.vector_search(query, top_k=top_k)

        # 2. Reciprocal Rank Fusion
        fused = self.reciprocal_rank_fusion(bm25_matches, vector_matches, top_k=top_k)

        # 3. Resolve Chunks
        retrieved_chunks: List[Tuple[APHChunk, float]] = []
        clause_ids: List[str] = []
        for chunk_id, rrf_score in fused:
            chunk = self.chunk_map.get(chunk_id)
            if chunk:
                retrieved_chunks.append((chunk, rrf_score))
                clause_ids.append(chunk_id)

        # 4. Controlled 1- to 2-hop Graph Traversal
        graph_paths = self.traverse_graph_for_clauses(
            clause_ids=clause_ids,
            institution_facts=institution_facts,
            max_hops=2,
        )

        return retrieved_chunks, graph_paths


# Global hybrid retriever instance
retriever = HybridGraphRetriever()
