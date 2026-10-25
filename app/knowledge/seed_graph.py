"""Layer 4 Task 2: Neo4j Knowledge Graph Seeding for AICTE Regulations.

Connects to Neo4j using the Python driver.
Extracts regulatory entities: (:RegulatoryClause), (:Programme), (:ApplicationType),
(:Requirement), (:LocationType), (:Exception).
Establishes directed relationships:
- (:Programme)-[:MANDATES]->(:Requirement)
- (:RegulatoryClause)-[:HAS_EXCEPTION]->(:Exception)
- (:RegulatoryClause)-[:APPLIES_TO]->(:LocationType)
- (:RegulatoryClause)-[:SPECIFIES]->(:Requirement)
- (:RegulatoryClause)-[:COVERS_PROGRAMME]->(:Programme)
- (:RegulatoryClause)-[:FOR_APPLICATION_TYPE]->(:ApplicationType)

Creates vector and full-text indexes in Neo4j (SHOW VECTOR INDEXES, SHOW FULLTEXT INDEXES)
and provides an in-memory graph fallback when Neo4j daemon is unavailable.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from neo4j import GraphDatabase

from app.knowledge.config import (
    CHUNKS_CACHE_PATH,
    EMBEDDING_DIMENSION,
    NEO4J_DATABASE,
    NEO4J_PASSWORD,
    NEO4J_URI,
    NEO4J_USER,
)
from app.knowledge.embeddings import embedding_manager
from app.knowledge.ingest_aph import APHChunk, ingest_aph_document

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# In-Memory Graph Implementation (Seamless Fallback for Offline Environments)
# ---------------------------------------------------------------------------
class InMemoryKnowledgeGraph:
    """High-performance in-memory graph store mirroring Neo4j graph model and indexes."""

    _instance: Optional["InMemoryKnowledgeGraph"] = None

    def __new__(cls) -> "InMemoryKnowledgeGraph":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.nodes = {}  # (label, id) -> dict of properties
            cls._instance.edges = []  # list of dicts: {from_label, from_id, rel, to_label, to_id, props}
            cls._instance.vector_index = {}  # node_id -> embedding
            cls._instance.fulltext_index = {}  # word -> set of node_ids
            cls._instance.is_seeded = False
        return cls._instance

    def clear(self) -> None:
        """Clear all nodes, edges, and indexes."""
        self.nodes.clear()
        self.edges.clear()
        self.vector_index.clear()
        self.fulltext_index.clear()
        self.is_seeded = False

    def add_node(self, label: str, node_id: str, properties: Dict[str, Any]) -> None:
        """Add or update a node with given label and properties."""
        key = (label, node_id)
        props = dict(properties)
        props["id"] = node_id
        props["_label"] = label
        self.nodes[key] = props

        # Update vector index if embedding present
        if "embedding" in props and props["embedding"]:
            self.vector_index[node_id] = props["embedding"]

        # Update fulltext index
        searchable_text = f"{props.get('text', '')} {props.get('title', '')} {props.get('name', '')} {props.get('description', '')}"
        words = re.findall(r"\w+", searchable_text.lower())
        for w in words:
            if w not in self.fulltext_index:
                self.fulltext_index[w] = set()
            self.fulltext_index[w].add(node_id)

    def add_edge(
        self,
        from_label: str,
        from_id: str,
        relationship: str,
        to_label: str,
        to_id: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a directed relationship between two nodes."""
        edge = {
            "from_label": from_label,
            "from_id": from_id,
            "rel": relationship,
            "to_label": to_label,
            "to_id": to_id,
            "properties": properties or {},
        }
        # Avoid duplicate edges
        if not any(
            e["from_label"] == from_label
            and e["from_id"] == from_id
            and e["rel"] == relationship
            and e["to_label"] == to_label
            and e["to_id"] == to_id
            for e in self.edges
        ):
            self.edges.append(edge)

    def get_node(self, label: str, node_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve node properties."""
        return self.nodes.get((label, node_id))

    def find_nodes(self, label: str, filter_fn=None) -> List[Dict[str, Any]]:
        """Find all nodes matching label and optional filter predicate."""
        results = []
        for (l, nid), props in self.nodes.items():
            if l == label:
                if filter_fn is None or filter_fn(props):
                    results.append(props)
        return results

    def traverse(
        self,
        start_label: str,
        start_id: str,
        max_hops: int = 2,
    ) -> List[Dict[str, Any]]:
        """Perform 1- to 2-hop traversal outward from the start node."""
        paths: List[Dict[str, Any]] = []
        visited_nodes: Set[Tuple[str, str]] = {(start_label, start_id)}

        # Hop 1
        hop1_targets: List[Tuple[str, str, str, Dict[str, Any]]] = []
        for edge in self.edges:
            if edge["from_label"] == start_label and edge["from_id"] == start_id:
                to_key = (edge["to_label"], edge["to_id"])
                to_node = self.nodes.get(to_key, {})
                paths.append(
                    {
                        "from_node": start_id,
                        "from_label": start_label,
                        "relationship": edge["rel"],
                        "to_node": edge["to_id"],
                        "to_label": edge["to_label"],
                        "properties": to_node,
                        "hop_depth": 1,
                    }
                )
                hop1_targets.append((edge["to_label"], edge["to_id"], edge["rel"], to_node))
                visited_nodes.add(to_key)

        # Hop 2
        if max_hops >= 2:
            for h1_label, h1_id, _, _ in hop1_targets:
                for edge in self.edges:
                    if edge["from_label"] == h1_label and edge["from_id"] == h1_id:
                        to_key = (edge["to_label"], edge["to_id"])
                        if to_key not in visited_nodes:
                            to_node = self.nodes.get(to_key, {})
                            paths.append(
                                {
                                    "from_node": h1_id,
                                    "from_label": h1_label,
                                    "relationship": edge["rel"],
                                    "to_node": edge["to_id"],
                                    "to_label": edge["to_label"],
                                    "properties": to_node,
                                    "hop_depth": 2,
                                }
                            )
                            visited_nodes.add(to_key)

        return paths


# Singleton in-memory graph instance
in_memory_graph = InMemoryKnowledgeGraph()


# ---------------------------------------------------------------------------
# Regulatory Domain Knowledge Definitions
# ---------------------------------------------------------------------------
STANDARD_PROGRAMMES = [
    {"id": "prog_eng", "name": "Engineering and Technology", "degree": "UG/PG"},
    {"id": "prog_mgmt", "name": "Management", "degree": "PG"},
    {"id": "prog_mca", "name": "MCA", "degree": "PG"},
    {"id": "prog_pharm", "name": "Pharmacy", "degree": "UG/PG"},
    {"id": "prog_arch", "name": "Architecture", "degree": "UG"},
]

STANDARD_APPLICATION_TYPES = [
    {"id": "app_new", "name": "Setting Up New Institution"},
    {"id": "app_eoa", "name": "Extension of Approval"},
    {"id": "app_intake", "name": "Increase in Intake"},
    {"id": "app_new_course", "name": "Introduction of New Courses"},
]

STANDARD_LOCATION_TYPES = [
    {"id": "loc_rural", "name": "Rural", "description": "Rural geographical classification"},
    {"id": "loc_urban", "name": "Urban", "description": "Urban municipality or corporation jurisdiction"},
    {"id": "loc_mega", "name": "Mega City", "description": "Declared mega metro / state capital area"},
    {"id": "loc_metro", "name": "Metro", "description": "Metropolitan urban zone"},
    {"id": "loc_hilly", "name": "Hilly Area", "description": "Designated hilly, tribal, or NER area"},
]

STANDARD_REQUIREMENTS = [
    {
        "id": "req_land_eng_rural",
        "title": "Minimum Land for Engineering (Rural)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 7.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 7.5 acres in Rural areas.",
    },
    {
        "id": "req_land_eng_urban",
        "title": "Minimum Land for Engineering (Urban)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 2.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 2.5 acres in Urban areas.",
    },
    {
        "id": "req_land_eng_mega",
        "title": "Minimum Land for Engineering (Mega City)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 1.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 1.5 acres in Mega Cities.",
    },
    {
        "id": "req_land_clu",
        "title": "Mandatory Change of Land Use (CLU) Certificate",
        "type": "StatutoryClearance",
        "metric": "land_use_certificate_valid",
        "min_value": 1.0,
        "unit": "boolean",
        "description": "Indisputable Land Use Certificate (CLU) for educational use from Competent Revenue Authority.",
    },
    {
        "id": "req_fsr_ug_eng",
        "title": "Faculty to Student Ratio (1:15 or 1:20)",
        "type": "Faculty",
        "metric": "faculty_student_ratio",
        "ratio": "1:15",
        "min_ratio_value": 15.0,
        "unit": "ratio",
        "description": "Undergraduate Engineering requires 1:15 for NBA accredited or 1:20 for approval.",
    },
    {
        "id": "req_fsr_pg_mgmt",
        "title": "Faculty to Student Ratio (1:20) for Management",
        "type": "Faculty",
        "metric": "faculty_student_ratio",
        "ratio": "1:20",
        "min_ratio_value": 20.0,
        "unit": "ratio",
        "description": "PG Management programmes require faculty to student ratio of 1:20.",
    },
    {
        "id": "req_cadre_ratio",
        "title": "Faculty Cadre Ratio 1:2:6",
        "type": "Faculty",
        "metric": "cadre_ratio",
        "ratio": "1:2:6",
        "unit": "ratio",
        "description": "Distribution of faculty positions shall be 1 Professor : 2 Associate Professors : 6 Assistant Professors.",
    },
    {
        "id": "req_faculty_regular_pct",
        "title": "Minimum 80% Regular Full-Time Faculty",
        "type": "Faculty",
        "metric": "regular_faculty_percent",
        "min_value": 80.0,
        "unit": "percent",
        "description": "At least 80% of faculty members must be regular full-time appointments.",
    },
    {
        "id": "req_builtup_area",
        "title": "Total Built-up Instructional Area (4,000 - 8,000 sqm)",
        "type": "Infrastructure",
        "metric": "total_builtup_area_sqm",
        "min_value": 4000.0,
        "unit": "sqm",
        "description": "Total built-up instructional and administrative area minimum 4,000 sqm initial scaling to 8,000 sqm.",
    },
    {
        "id": "req_statutory_fire_noc",
        "title": "State Fire Services Life Safety NOC",
        "type": "StatutoryClearance",
        "metric": "fire_safety_noc_valid",
        "min_value": 1.0,
        "unit": "boolean",
        "description": "Unexpired Fire and Life Safety Certificate from State Fire Services Department.",
    },
    {
        "id": "req_forensics_integrity",
        "title": "Visual Forensics Authenticity (Low Tampering Risk)",
        "type": "Forensics",
        "metric": "composite_tampering_score",
        "max_value": 35.0,
        "unit": "score",
        "description": "Document must have composite tampering score <= 35.0 and no detected visual smoothing or stamp tampering.",
    },
    {
        "id": "req_pki_signature",
        "title": "Cryptographic PKI Signature & Authoritative QR",
        "type": "Verification",
        "metric": "trust_score",
        "min_value": 75.0,
        "unit": "score",
        "description": "Affidavits and statutory certificates must bear valid PKI digital signatures or authoritative government QR codes.",
    },
]

STANDARD_EXCEPTIONS = [
    {
        "id": "exc_mega_city_land",
        "clause_ref": "Clause 2.1.4",
        "title": "Mega City Land Relaxation",
        "description": "Up to 50% relaxation in land area for Mega Cities (Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad) and State Capitals subject to higher FSI/FAR compliance.",
        "condition": "Location in declared Mega City or State Capital with vertical FSI compliance.",
    },
    {
        "id": "exc_prof_practice",
        "clause_ref": "Clause 3.2.5",
        "title": "Professors of Practice Exception",
        "description": "Up to 20% of required faculty positions may be appointed as Adjunct Faculty or Professors of Practice from industry without Ph.D.",
        "condition": "Industry expertise and distinguished practitioner track record.",
    },
    {
        "id": "exc_land_two_plots",
        "clause_ref": "Clause 2.1.2",
        "title": "Split Land Parcel Exception",
        "description": "A maximum of two plots separated by distance of not more than 2.0 km permissible if both exclusively owned by sponsoring Trust.",
        "condition": "Distance between plots <= 2.0 km.",
    },
]


class Neo4jKnowledgeGraphSeeder:
    """Connects to Neo4j, establishes schema indexes, and seeds regulatory graph."""

    def __init__(
        self,
        uri: str = NEO4J_URI,
        user: str = NEO4J_USER,
        password: str = NEO4J_PASSWORD,
        database: str = NEO4J_DATABASE,
    ) -> None:
        self.uri = uri
        self.user = user
        self.password = password
        self.database = database
        self.driver = None
        self._connected: Optional[bool] = None

    def connect(self) -> bool:
        """Establish or verify connectivity to Neo4j database."""
        if self._connected is not None:
            return self._connected

        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                connection_timeout=1.0,
            )
            self.driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j instance at %s", self.uri)
            self._connected = True
        except Exception as exc:
            logger.info(
                "Neo4j offline at %s (%s). Utilizing high-performance InMemoryKnowledgeGraph.",
                self.uri,
                exc,
            )
            self._connected = False
            self.driver = None
        return self._connected

    def close(self) -> None:
        """Close Neo4j driver connection."""
        if self.driver is not None:
            try:
                self.driver.close()
            except Exception:
                pass
            self.driver = None
            self._connected = None

    def create_indexes(self) -> None:
        """Create vector and full-text indexes in Neo4j (SHOW VECTOR INDEXES, SHOW FULLTEXT INDEXES)."""
        if not self.connect() or not self.driver:
            logger.info("Neo4j offline. Skipping live index creation (in-memory index active).")
            return

        with self.driver.session(database=self.database) as session:
            try:
                # 1. Check existing vector indexes
                result = session.run("SHOW VECTOR INDEXES")
                vector_indexes = [record["name"] for record in result]
                logger.info("Current Neo4j vector indexes: %s", vector_indexes)

                if "clause_vector_index" not in vector_indexes:
                    logger.info("Creating vector index 'clause_vector_index' on :RegulatoryClause(embedding)...")
                    session.run(
                        """
                        CREATE VECTOR INDEX clause_vector_index IF NOT EXISTS
                        FOR (c:RegulatoryClause) ON (c.embedding)
                        OPTIONS {indexConfig: {
                            `vector.dimensions`: $dim,
                            `vector.similarity_function`: 'cosine'
                        }}
                        """,
                        dim=EMBEDDING_DIMENSION,
                    )
                    logger.info("Vector index 'clause_vector_index' created successfully.")

                # 2. Check existing fulltext indexes
                result = session.run("SHOW FULLTEXT INDEXES")
                fulltext_indexes = [record["name"] for record in result]
                logger.info("Current Neo4j fulltext indexes: %s", fulltext_indexes)

                if "clause_fulltext_index" not in fulltext_indexes:
                    logger.info("Creating fulltext index 'clause_fulltext_index' on :RegulatoryClause...")
                    session.run(
                        """
                        CREATE FULLTEXT INDEX clause_fulltext_index IF NOT EXISTS
                        FOR (c:RegulatoryClause) ON EACH [c.text, c.title, c.clause_reference, c.section_id]
                        """
                    )
                    logger.info("Full-text index 'clause_fulltext_index' created successfully.")

            except Exception as exc:
                logger.warning("Error creating Neo4j indexes: %s", exc)

    def seed_knowledge_graph(self, chunks: Optional[List[APHChunk]] = None) -> Dict[str, int]:
        """Parse chunks, extract regulatory entities, and seed graph nodes & directed relationships."""
        if chunks is None:
            if CHUNKS_CACHE_PATH.exists():
                with open(CHUNKS_CACHE_PATH, "r", encoding="utf-8") as f:
                    raw_chunks = json.load(f)
                    chunks = [APHChunk(**c) for c in raw_chunks]
            else:
                chunks = ingest_aph_document()

        logger.info("Seeding knowledge graph with %d chunks...", len(chunks))
        use_neo4j = self.connect() and self.driver is not None

        if use_neo4j:
            self.create_indexes()

        counts = {
            "clauses": 0,
            "programmes": 0,
            "application_types": 0,
            "requirements": 0,
            "location_types": 0,
            "exceptions": 0,
            "relationships": 0,
        }

        # -------------------------------------------------------------------
        # 1. Seed Core Reference Entities (InMemory + Neo4j)
        # -------------------------------------------------------------------
        for prog in STANDARD_PROGRAMMES:
            in_memory_graph.add_node("Programme", prog["id"], prog)
            counts["programmes"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (p:Programme {id: $id}) SET p += $props",
                    id=prog["id"],
                    props=prog,
                )

        for app_type in STANDARD_APPLICATION_TYPES:
            in_memory_graph.add_node("ApplicationType", app_type["id"], app_type)
            counts["application_types"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (a:ApplicationType {id: $id}) SET a += $props",
                    id=app_type["id"],
                    props=app_type,
                )

        for loc in STANDARD_LOCATION_TYPES:
            in_memory_graph.add_node("LocationType", loc["id"], loc)
            counts["location_types"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (l:LocationType {id: $id}) SET l += $props",
                    id=loc["id"],
                    props=loc,
                )

        for req in STANDARD_REQUIREMENTS:
            in_memory_graph.add_node("Requirement", req["id"], req)
            counts["requirements"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (r:Requirement {id: $id}) SET r += $props",
                    id=req["id"],
                    props=req,
                )

        for exc in STANDARD_EXCEPTIONS:
            in_memory_graph.add_node("Exception", exc["id"], exc)
            counts["exceptions"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (e:Exception {id: $id}) SET e += $props",
                    id=exc["id"],
                    props=exc,
                )

        # -------------------------------------------------------------------
        # 2. Seed Regulatory Clause Nodes from Chunks
        # -------------------------------------------------------------------
        for chunk in chunks:
            # Generate 1024-d BGE-M3 embedding for the chunk
            embedding = embedding_manager.embed_text(chunk.text)

            clause_props = {
                "clause_id": chunk.chunk_id,
                "title": chunk.title,
                "edition_year": chunk.edition_year,
                "section_id": chunk.section_id,
                "clause_reference": chunk.clause_reference,
                "page_number": chunk.page_number,
                "table_context": chunk.table_context or "",
                "text": chunk.text,
                "approx_tokens": chunk.approx_tokens,
                "embedding": embedding,
            }

            in_memory_graph.add_node("RegulatoryClause", chunk.chunk_id, clause_props)
            counts["clauses"] += 1

            if use_neo4j:
                self._execute_cypher(
                    """
                    MERGE (c:RegulatoryClause {id: $id})
                    SET c += $props
                    """,
                    id=chunk.chunk_id,
                    props=clause_props,
                )

        # -------------------------------------------------------------------
        # 3. Build Directed Relationships
        # -------------------------------------------------------------------
        # (:Programme)-[:MANDATES]->(:Requirement)
        prog_mandates = [
            ("prog_eng", "req_land_eng_rural"),
            ("prog_eng", "req_land_eng_urban"),
            ("prog_eng", "req_land_eng_mega"),
            ("prog_eng", "req_land_clu"),
            ("prog_eng", "req_fsr_ug_eng"),
            ("prog_eng", "req_cadre_ratio"),
            ("prog_eng", "req_faculty_regular_pct"),
            ("prog_eng", "req_builtup_area"),
            ("prog_eng", "req_statutory_fire_noc"),
            ("prog_eng", "req_forensics_integrity"),
            ("prog_eng", "req_pki_signature"),
            ("prog_mgmt", "req_fsr_pg_mgmt"),
            ("prog_mgmt", "req_land_clu"),
            ("prog_mgmt", "req_statutory_fire_noc"),
            ("prog_mca", "req_fsr_pg_mgmt"),
        ]
        for prog_id, req_id in prog_mandates:
            self._link_entities("Programme", prog_id, "MANDATES", "Requirement", req_id)
            counts["relationships"] += 1

        # (:RegulatoryClause)-[:HAS_EXCEPTION]->(:Exception)
        clause_exceptions = [
            ("Clause 2.1.4", "exc_mega_city_land"),
            ("Clause 3.2.5", "exc_prof_practice"),
            ("Clause 2.1.2", "exc_land_two_plots"),
        ]
        for clause_ref, exc_id in clause_exceptions:
            clause_nodes = in_memory_graph.find_nodes(
                "RegulatoryClause",
                lambda p, c=clause_ref: c.lower() in p.get("text", "").lower()
                or c.lower() in p.get("clause_reference", "").lower(),
            )
            for cnode in clause_nodes:
                self._link_entities("RegulatoryClause", cnode["id"], "HAS_EXCEPTION", "Exception", exc_id)
                counts["relationships"] += 1

        # (:RegulatoryClause)-[:APPLIES_TO]->(:LocationType)
        clause_locations = [
            ("Section 2.1", "loc_rural"),
            ("Section 2.1", "loc_urban"),
            ("Section 2.1", "loc_mega"),
            ("Clause 2.1.4", "loc_mega"),
        ]
        for sec_ref, loc_id in clause_locations:
            matching_clauses = in_memory_graph.find_nodes(
                "RegulatoryClause",
                lambda p, s=sec_ref: s.lower() in p.get("section_id", "").lower()
                or s.lower() in p.get("text", "").lower(),
            )
            for cnode in matching_clauses:
                self._link_entities("RegulatoryClause", cnode["id"], "APPLIES_TO", "LocationType", loc_id)
                counts["relationships"] += 1

        # (:RegulatoryClause)-[:SPECIFIES]->(:Requirement)
        clause_req_links = [
            ("Section 2.1", "req_land_eng_rural"),
            ("Section 2.1", "req_land_eng_urban"),
            ("Section 2.1", "req_land_clu"),
            ("Section 3.2", "req_fsr_ug_eng"),
            ("Section 3.2", "req_cadre_ratio"),
            ("Section 3.2", "req_faculty_regular_pct"),
            ("Section 4.1", "req_builtup_area"),
            ("Section 5.1", "req_statutory_fire_noc"),
            ("Section 5.2", "req_forensics_integrity"),
            ("Section 5.2", "req_pki_signature"),
        ]
        for sec_ref, req_id in clause_req_links:
            matching_clauses = in_memory_graph.find_nodes(
                "RegulatoryClause",
                lambda p, s=sec_ref: s.lower() in p.get("section_id", "").lower()
                or s.lower() in p.get("title", "").lower()
                or s.lower() in p.get("text", "").lower(),
            )
            for cnode in matching_clauses:
                self._link_entities("RegulatoryClause", cnode["id"], "SPECIFIES", "Requirement", req_id)
                counts["relationships"] += 1

        # (:RegulatoryClause)-[:COVERS_PROGRAMME]->(:Programme)
        for cnode in in_memory_graph.find_nodes("RegulatoryClause"):
            text_lower = cnode.get("text", "").lower()
            if "engineering" in text_lower or "technology" in text_lower:
                self._link_entities("RegulatoryClause", cnode["id"], "COVERS_PROGRAMME", "Programme", "prog_eng")
                counts["relationships"] += 1
            if "management" in text_lower or "mba" in text_lower:
                self._link_entities("RegulatoryClause", cnode["id"], "COVERS_PROGRAMME", "Programme", "prog_mgmt")
                counts["relationships"] += 1

        in_memory_graph.is_seeded = True
        logger.info("Graph seeding complete: %s", counts)
        return counts

    def _link_entities(
        self,
        from_label: str,
        from_id: str,
        rel: str,
        to_label: str,
        to_id: str,
    ) -> None:
        """Establish directed edge in in-memory graph and Neo4j if active."""
        in_memory_graph.add_edge(from_label, from_id, rel, to_label, to_id)

        if self._connected and self.driver:
            cypher = f"""
            MATCH (a:{from_label} {{id: $from_id}})
            MATCH (b:{to_label} {{id: $to_id}})
            MERGE (a)-[r:{rel}]->(b)
            """
            self._execute_cypher(cypher, from_id=from_id, to_id=to_id)

    def _execute_cypher(self, query: str, **params) -> List[Dict[str, Any]]:
        """Safely execute a Cypher statement with parameterization."""
        if not self._connected or not self.driver:
            return []
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, **params)
                return [record.data() for record in result]
        except Exception as exc:
            logger.warning("Cypher query error: %s on query: %s", exc, query[:80])
            return []


# Global seeder instance
graph_seeder = Neo4jKnowledgeGraphSeeder()


def seed_graph_database() -> Dict[str, int]:
    """Top-level helper to seed Neo4j and in-memory knowledge graph."""
    return graph_seeder.seed_knowledge_graph()


if __name__ == "__main__":
    seed_graph_database()
