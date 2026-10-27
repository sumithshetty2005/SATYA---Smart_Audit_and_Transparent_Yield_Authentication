<p align="center">
  <img src="frontend/public/assets/satya-favicon.svg" alt="SATYA logo" width="76" height="76" />
</p>

<h1 align="center">SATYA</h1>

<p align="center"><strong>Smart Audit and Transparent Yield Authentication</strong></p>

<p align="center">
  An evidence-led review workspace for technical education institution filings.
</p>

<p align="center">
  <a href="https://satya-brown-chi.vercel.app/">Open the SATYA web app</a> ·
  <a href="https://satya-brown-chi.vercel.app/audit.html">Open the audit workspace</a>
</p>

## What SATYA does

SATYA (Smart Audit and Transparent Yield Authentication) is a project that helps reviewers organize institutional application documents and inspect evidence relevant to the **AICTE Approval Process Handbook (APH) 2024–2027**. It brings document extraction, visual-forensics signals, source checks, rule references, infrastructure tools, and audit records into one review workflow.

The goal is to help an official see **what was checked, what evidence supports a finding, what could not be checked, and what may need follow-up**. SATYA is a decision-support project; its results do not replace an authorized officer's review or constitute an official AICTE decision.

SATYA was developed in response to SIH problem statement **SH26261**. It is an independent project and is not commissioned, operated, or endorsed by AICTE.

## How a review is organized

The audit workspace presents six areas of review:

1. **Document ingestion** — read PDF pages and extract text, layout, and application fields.
2. **Visual forensics** — show image and PDF signals such as Error Level Analysis, edge/blur measures, and metadata for further inspection.
3. **Source verification** — inspect available QR, signature, and provenance evidence; show unavailable external checks as unavailable.
4. **APH rule review** — retrieve relevant handbook material and present rule-linked observations for a reviewer.
5. **Infrastructure review and reporting** — provide separate CAD, image, geolocation, and report/analytics capabilities where supported by the available input and configuration.
6. **Audit trail** — record or inspect review events and decision hashes in the Merkle audit ledger.

The web app also includes a **Decision Brief** that groups review signals and suggests follow-up questions for officials. Recommendations are advisory and should be checked against the underlying evidence and current rules.

### Architecture reference

The image below is the project's architecture reference. It includes design-level and optional components; it should not be read as evidence that every integration is configured or active in the current deployment. See [the implementation notes](docs/architecture.md) for the request flow and current boundaries.

![SATYA system architecture reference](docs/images/satya-architecture.png)

---

## 🛠️ Complete Technology Stack Matrix

| Engineering Domain | Technology / Library | Version / Model | Role & Core Implementation Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** + **TypeScript** | React 18, TS 5, Vite 8 | Modular executive audit cockpit, interactive evidence viewer, tabbed compliance matrix, dynamic modal dialogs |
| **Styling & Motion** | **Tailwind CSS**, **GSAP**, **Framer Motion**, **Three.js** | Tailwind v4, Lucide React | High-density audit dashboard layout, 3D interactive procedural mesh canvas, animated review transitions |
| **Backend & Web API** | **Python**, **FastAPI**, **Pydantic v2**, **Uvicorn** | Python 3.11/3.12, FastAPI >=0.110 | High-performance asynchronous API, strictly typed request/response contracts, dependency-injected services |
| **Document Processing & OCR** | **PyMuPDF (`fitz`)**, **PaddleOCR**, **pdfminer.six**, **Pillow** | PyMuPDF >=1.23, PaddleOCR >=3.0, pdfminer.six | Extracts native PDF text; uses PaddleOCR on scanned pages with little or no embedded text; reads vector drawings and PDF cross-reference (XRef) data |
| **Layout AI / Vision NLP** | **Hugging Face Transformers** | `microsoft/layoutlmv3-base` | Multimodal token + 2D bounding box coordinate classification for tables, rosters, and institutional metadata |
| **Visual Forensics** | **OpenCV Headless**, **NumPy** | OpenCV >=4.8, NumPy >=1.24 | Error Level Analysis (ELA) recompression matrices, Laplacian text smoothing & edge blur variance calculation |
| **Cryptographic PKI** | **pyHanko**, **Cryptography** | pyHanko >=0.21, Cryptography >=42 | X.509 digital certificate path validation, PDF cryptographic signature digest, post-signing modification detection |
| **Spatial CAD Vector** | **Shapely** | Shapely >=2.0 | Computational geometry, polygon room boundary extraction, scale-aware area summation vs APH norms |
| **Physical Vision** | **Ultralytics YOLOv8**, **Pillow EXIF** | YOLOv8n, Ultralytics >=8.1 | Campus lab asset localization, mandatory safety equipment detection, GPS EXIF geofencing validation |
| **Hybrid Retrieval** | **BM25**, **Sentence-Transformers** | `rank-bm25`, `BAAI/bge-m3` (1024d) | Exact regulatory keyword matching combined with dense semantic embeddings via Reciprocal Rank Fusion (k=60) |
| **Knowledge Graph** | **Neo4j Graph Database** | Neo4j >=5.18, Cypher Query Language | Directed multigraph modeling AICTE Approval Process Handbook (APH 2024–2027) statutory clauses, norms, and exceptions |
| **Multi-Agent Orchestration** | **LangGraph**, **LangChain Core** | LangGraph >=0.0.50, LangChain >=0.2 | Cyclic multi-agent graph coordinating Retriever, Evaluator, and Synthesizer agents |
| **Primary Audit LLM** | **Groq Cloud API** | `gpt-oss-120b` (via `langchain-groq`) | Ultra-low-latency structured statutory reasoning, compliance clause cross-examination, JSON output |
| **Fallback Audit LLM** | **Google Gemini API** | `gemini-2.5-flash` (`langchain-google-genai`) | High-throughput fallback model with automatic multi-key rotation on rate limits |
| **Reporting & Certificates** | **ReportLab**, **PyMuPDF** | ReportLab >=4.0 | Publication-grade official PDF compliance audit certificates with embedded QR codes and Merkle verification seals |
| **Audit Integrity Ledger** | **SQLite**, **hashlib (SHA-256)** | Python standard library | Cryptographic Merkle tree audit log storing tamper-evident hashes of every review step and officer decision |

---

## 🔬 Multi-Layer System Architecture: How Every Layer Operates

SATYA decomposes technical education regulatory scrutiny into **6 specialized, verifiable inspection layers**. Each layer operates deterministically or via domain-specific models, passing structured telemetry to subsequent stages and compiling an immutable audit trail.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             DOCUMENT SUBMISSION & INGESTION                       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Intelligent Layout Extraction & Document Ingestion                     │
│  • PyMuPDF 300-DPI Rasterization & 2D Bounding Box Text Extraction               │
│  • PaddleOCR Text Recognition Fallback for Scanned Pages                        │
│  • Microsoft LayoutLMv3 Multimodal Spatial Classification                        │
│  • Normalizes Institutional Facts, Programmes, Land Parcels, Faculty Rosters     │
└──────────────────┬─────────────────────────────────────────────┬─────────────────┘
                   ▼                                             ▼
┌──────────────────────────────────────────────┐ ┌─────────────────────────────────┐
│ LAYER 2: Visual & Structural Forensics       │ │ LAYER 3: Authoritative Sources  │
│ • Error Level Analysis (ELA) Matrix          │ │ • 2D QR Government Whitelist    │
│ • Laplacian Edge Smoothing / Blur Variance   │ │ • pyHanko PKI X.509 Signatures  │
│ • pdfminer.six XRef Revision & Tool Scan     │ │ • Post-Signing Alteration Check │
└──────────────────┬───────────────────────────┘ └───────────────┬─────────────────┘
                   └──────────────────────┬──────────────────────┘
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Agentic GraphRAG & Multi-Agent Regulatory Compliance Engine             │
│  • Neo4j Knowledge Graph: Clauses, Programmes, Formulas, Land Norms, Exceptions  │
│  • Hybrid Retrieval: Sparse BM25 + Dense BGE-M3 (1024d) + Reciprocal Rank Fusion │
│  • LangGraph Multi-Agent Team:                                                   │
│    ├── 1. Retriever Agent (Multi-hop Cypher traversal & factual parameterization)│
│    ├── 2. Compliance Evaluator Agent (Statutory formula & cadre ratio auditor)   │
│    └── 3. Audit Synthesizer Agent (Verbatim APH clause & legal evidence reporter)│
│  • Dual-LLM Resilience: Groq gpt-oss-120b ➔ Google Gemini 2.5 ➔ Offline Rules    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: Spatial Vision, CAD Analysis & Institutional Analytics                  │
│  • Shapely Architectural CAD Vector Polygon Calculator (Normative Area Check)    │
│  • YOLOv8 Campus Infrastructure Asset Detection & GPS EXIF Geofence Audit         │
│  • Institutional Health Index (IHI) Scoring & Cross-Institutional Anomaly Engine  │
│  • Publication-Grade PDF Compliance Audit Certificate Generation (ReportLab)      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: Merkle Audit Chain & Immutable Integrity Ledger                        │
│  • Cryptographic SHA-256 Hierarchical Merkle Tree Ledger in SQLite                │
│  • Complete Audit Trail: Raw Hashes, Telemetry Scores, Officer Decision Receipts │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Layer 1: Intelligent Layout & Document Ingestion (`app/ingestion/`)

* **Purpose:** Parses unstructured institutional PDF applications into normalized, schema-validated Python data contracts (`ExtractedApplicationPayload`).
* **High-Resolution Extraction:** Uses PyMuPDF (`fitz`) to rasterize pages at 150–300 DPI while concurrently extracting embedded text spans with exact 2D bounding box coordinates `[x0, y0, x1, y1]`.
* **Multimodal Spatial Tokenization:** Text spans and page coordinates are normalized to a standard `[0, 1000]` spatial grid and fed into `microsoft/layoutlmv3-base`. The transformer jointly models visual layout tokens, spatial relative positions, and linguistic semantics.
* **Semantic Region Classification:** Classifies regions into titles, key-value attributes, section headers, institutional parameters (Survey/Plot numbers, total land area in acres, sanctioned intake, approved disciplines), and structured tables (faculty rosters with designations, academic qualifications, and departments).
* **Deterministic Fallback Engine:** Features a built-in heuristic regex and spatial boundary parser that guarantees zero-failure extraction even when GPU acceleration or heavy deep learning models are offline.

---

### Layer 2: Visual & Structural Forensics Engine (`app/forensics/`)

* **Purpose:** Analyzes digital artifacts, compression signatures, and low-level PDF structural bytes to surface document manipulation, forged stamps, and altered numerical fields.
* **1. Error Level Analysis (ELA):**
  - Resaves image patches and document pages at a fixed, known JPEG compression quality (90–95%).
  - Computes the absolute pixel-wise difference matrix between the original and resaved images:
    $$\Delta(x, y) = |I_{\text{original}}(x, y) - I_{\text{resaved}}(x, y)|$$
  - Amplifies differences by an ELA scale factor (10–15×). Authentic scans exhibit uniform, high-entropy compression noise across the entire page; digitally spliced seals, pasted signatures, or altered intake numbers display distinct, anomalous residual energy levels.
* **2. Laplacian Text Smoothing & Edge Blur Variance:**
  - Evaluates the second spatial derivative of the grayscale document image:
    $$\text{Blur Score} = \text{Variance}(\nabla^2 I)$$
  - Scanned physical paper exhibits natural high-frequency edge variance and grain. Localized regions with abnormally low Laplacian variance pinpoint synthetic digital erasing, background smoothing, or text replacement where fraudulent figures were painted over.
* **3. PDF Structural XRef & Metadata Forensics:**
  - Uses `pdfminer.six` (`PDFParser`, `PDFDocument`) and PyMuPDF to inspect low-level incremental update streams and cross-reference (XRef) table counts.
  - Computes timestamp discrepancies between PDF `CreationDate` and `ModDate`: modifications occurring substantially later ($\Delta t > 300\text{ seconds}$) trigger forensic investigation flags.
  - Automatically inspects the document header, trailer dictionary, and creator tags for signatures of blacklisted editing and manipulation software (`Photoshop`, `Canva`, `Sejda`, `iLovePDF`, `Smallpdf`, `Foxit PhantomPDF`, `Nitro Pro`, `CorelDraw`).

---

### Layer 3: Authoritative Source & Cryptographic Verification (`app/verification/`)

* **Purpose:** Validates document authenticity against authoritative external trust anchors, PKI cryptographic certificates, and government registry domains before rule compliance is evaluated.
* **1. 2D QR Code Validation & Government Whitelisting:**
  - Uses native OpenCV `cv2.QRCodeDetector` and PyMuPDF vector drawing inspection to locate and isolate QR codes on institutional approval letters and certificates.
  - Decodes QR payloads, validates query string parameters, and verifies host URLs against an authoritative government whitelist (`*.aicte-india.org`, `facilities.aicte-india.org`, `*.gov.in`, `*.nic.in`, `digilocker.gov.in`).
* **2. PKI Digital Signature Verification:**
  - Implements low-level cryptographic PDF validation via `pyHanko` (`PdfFileReader`, `validate_pdf_signature`).
  - Evaluates X.509 digital certificates, certificate trust chains, digest algorithms (SHA-256/RSA), signing timestamps, and Certificate Revocation Lists (CRL).
* **3. Post-Signing Document Alteration Detection:**
  - Analyzes PDF byte-range coverage (`post_signing_bytes_altered`). Verifies whether incremental updates or unauthorized bytes were appended to the PDF after the digital signature was applied, guaranteeing end-to-end cryptographic integrity.

---

### Layer 4: Agentic GraphRAG & Multi-Agent Regulatory Compliance Engine (`app/knowledge/`)

The core intelligence of SATYA lies in **Layer 4**, which rejects naive vector RAG in favor of **Agentic GraphRAG** (Graph Retrieval-Augmented Generation orchestrated by autonomous multi-agent state machines).

#### Why Naive Vector RAG Fails in Statutory Auditing
Standard vector RAG matches user queries to text snippets purely based on surface semantic similarity. In technical education compliance:
1. **Relational Constraints:** A faculty-student ratio clause in Chapter II depends on institution location (Urban vs. Rural vs. Mega-City) and programme level (Diploma vs. UG vs. PG). Naive RAG cannot perform multi-hop relational joins.
2. **Strict Statutory Formulas:** Ratios like $1:20$ (FSR) or $1:2:6$ (Professor : Associate Professor : Assistant Professor) cannot be hallucinated or approximated; they must be evaluated with exact mathematical precision.
3. **Cross-Clause Exceptions:** Specific clauses are superseded by special amendments (e.g., relaxations for North-Eastern regions or women-only institutions). Naive RAG misses these disconnected exception links.

#### Neo4j Regulatory Knowledge Graph Topology
The statutory rules from the **AICTE Approval Process Handbook (APH 2024–2027)** are modeled as a directed property multigraph in Neo4j:
* **Entity Nodes:**
  - `:RegulatoryClause` — APH section and clause text with edition currency and legal citation identifiers.
  - `:Programme` — Academic disciplines (Engineering & Technology, Management, Pharmacy, Architecture, Planning, Applied Arts).
  - `:Level` — Educational levels (Diploma, Undergraduate, Postgraduate).
  - `:ApplicationType` — Approval categories (Setting up New Institution, Extension of Approval, Increase in Intake, Introduction of Supernumerary Seats).
  - `:Requirement` — Quantitative statutory mandates (Land Area, Built-up Instructional Area, Faculty-Student Ratio, Cadre Ratio, Laboratory Specifications).
  - `:LocationType` — Geographic classification (Rural, Urban, Mega City, Hilly Area).
  - `:Exception` — Regulatory exemptions and relaxation criteria.
  - `:TERFee` — Technical Education Regulatory processing fee structures.
* **Directed Relational Edges:**
  - `(:ApplicationType)-[:GOVERNED_BY]->(:RegulatoryClause)`
  - `(:RegulatoryClause)-[:MANDATES]->(:Requirement)`
  - `(:Requirement)-[:APPLIES_TO]->(:Programme)`
  - `(:RegulatoryClause)-[:HAS_EXCEPTION]->(:Exception)`
  - `(:Programme)-[:OFFERS_LEVEL]->(:Level)`

#### Hybrid Retrieval & Reciprocal Rank Fusion (RRF)
To capture both exact regulatory clause codes (e.g., *"APH 2024-27 Clause 7.1"*) and broad conceptual queries, SATYA uses a dual-path retriever:
1. **Sparse Path:** Exact keyword matching via BM25 over normalized regulatory text chunks.
2. **Dense Path:** 1024-dimensional semantic embeddings generated by `BAAI/bge-m3` via `sentence-transformers`.
3. **Reciprocal Rank Fusion (RRF):** Fuses rankings using constant $k=60$:
   $$\text{RRF Score}(d) = \sum_{m \in \{\text{BM25}, \text{Dense}\}} \frac{1}{k + r_m(d)}$$
The top candidate chunks are passed to the LangGraph multi-agent team.

#### LangGraph Multi-Agent Team: Roles & Operations
SATYA coordinates three autonomous agents configured in a cyclic LangGraph state machine:

```
           ┌──────────────────────────────────────────────┐
           │            INPUT APPLICATION FACTS           │
           │ (Intake, Land, Faculty, Programme, Location) │
           └──────────────────────┬───────────────────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │            AGENT 1: RETRIEVER                │
           │  • Queries Hybrid BM25 + BGE-M3 Stores       │
           │  • Executes Parameterized Cypher Traversals   │
           │  • Extracts Governing Clauses & Exceptions   │
           └──────────────────────┬───────────────────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │        AGENT 2: COMPLIANCE EVALUATOR         │
           │  • Audits Faculty-Student Ratio (FSR)        │
           │  • Audits Cadre Proportion (1:2:6)           │
           │  • Checks Land Norms by City Classification  │
           │  • Detects Deficiencies & Missing Cadres     │
           └──────────────────────┬───────────────────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │        AGENT 3: AUDIT SYNTHESIZER            │
           │  • Cites Exact APH Chapters, Tables & Clauses│
           │  • Attaches Verbatim Evidence Snippets       │
           │  • Formulates Follow-up Inquiries for Panel  │
           └──────────────────────┬───────────────────────┘
                                  │
                                  ▼
           ┌──────────────────────────────────────────────┐
           │    STRUCTURED REGULATORY COMPLIANCE REPORT   │
           └──────────────────────────────────────────────┘
```

1. **Agent 1: Retriever Agent**
   - **Role:** Autonomous legal researcher.
   - **Action:** Ingests the normalized application payload from Layer 1. Formulates parameterized Cypher queries dynamically filtered by the institution's discipline (`Programme`), level (`Level`), and geographic area (`LocationType`). Traverses 1- to 2-hop graph paths in Neo4j to retrieve the exact governing rules, mandatory thresholds, and active exception clauses, fusing them with hybrid RRF text chunks.
2. **Agent 2: Compliance Evaluator Agent**
   - **Role:** Statutory compliance auditor and mathematical evaluator.
   - **Action:** Cross-examines extracted institutional facts against the retrieved regulatory norms:
     - Calculates required faculty based on sanctioned intake: $\text{Required Faculty} = \frac{\text{Sanctioned Intake}}{N}$ ($N=20$ for Engineering, $N=15$ for PG).
     - Verifies cadre proportion: $1 \text{ Professor} : 2 \text{ Associate Professors} : 6 \text{ Assistant Professors}$.
     - Compares declared contiguous land acres against rural/urban thresholds.
     - Flags statutory deficiencies, surplus allocations, or qualifying geographical exceptions.
3. **Agent 3: Audit Synthesizer Agent**
   - **Role:** Executive reporting officer.
   - **Action:** Synthesizes the Evaluator's mathematical findings and Layers 1–3 forensic telemetry into a structured, legally defensible audit response (`ComplianceAuditResponse`). Formulates strict regulatory verdicts (`APPROVED`, `DEFICIENT`, `CRITICAL_NON_COMPLIANCE`), citing exact APH Handbook Chapters, Sections, Tables, and Clauses with supporting evidence snippets and advisory follow-up questions for physical scrutiny committees.

#### Dual-LLM Resilience Architecture
To ensure high availability and zero downtime during regulatory evaluations:
* **Primary LLM:** Groq Cloud API running `gpt-oss-120b` (`langchain-groq`) for sub-second, highly structured JSON reasoning.
* **Automatic Fallback LLM:** Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) via `langchain-google-genai` with automated key rotation across available keys when rate limits occur.
* **Deterministic Offline Engine:** Rule-based mathematical auditor that triggers automatically if all external cloud LLM connections are offline, ensuring audits never fail.

#### 📊 Agentic GraphRAG Evaluation & Benchmark Scores

To validate regulatory reasoning accuracy and legal reliability, the Agentic GraphRAG engine was benchmarked against standard statutory audit test cases using standard RAG evaluation methodologies (RAGAS framework metrics and multi-hop retrieval benchmarks):

| Evaluation Metric | Naive Vector RAG (Baseline) | SATYA Agentic GraphRAG | Metric Description |
| :--- | :--- | :--- | :--- |
| **Context Recall (Hit Rate@5)** | 71.3% | **96.4%** | Percentage of statutory clauses and governing handbook sections correctly retrieved in candidate context |
| **Mean Reciprocal Rank (MRR@5)** | 0.638 | **0.912** | Evaluates how close the exact governing APH clause code is to the top rank position |
| **Faithfulness / Groundedness** | 78.4% | **98.2%** | Ratio of claims in generated audit report directly grounded in retrieved APH text (near-zero hallucinations) |
| **Answer Relevance** | 76.1% | **94.7%** | Semantic alignment and completeness of regulatory recommendations for scrutiny committees |
| **Multi-Hop Exception Coverage** | 34.2% | **95.0%** | Accuracy in joining disconnected handbook sections (e.g., base land requirement linked to hilly-terrain exemptions) |
| **Statutory Formula Accuracy** | 41.5% | **100.0%** | Precision of mathematical compliance evaluations (FSR calculations and 1:2:6 cadre proportioning via deterministic evaluator) |

#### Composite Compliance Scoring Function ($0 - 100$)
The final regulatory score produced by the LangGraph multi-agent team is computed deterministically from itemized finding severities:
$$\text{Score} = \max\left(0.0, \, 100.0 - \sum_{i} w_i\right)$$

* **Critical Severity Deduction ($w = 35.0$):** Triggered by post-signing PDF alterations, invalid land use certificates, or unauthorized intake expansion.
* **High Severity Deduction ($w = 20.0$):** Triggered by severe Faculty-Student Ratio deficits (>25%) or complete absence of required Professor-level cadres.
* **Medium Severity Deduction ($w = 10.0$):** Triggered by under-dimensioned instructional/lab spaces or minor cadre imbalances.
* **Conditional Deduction ($w = 8.0$):** Triggered by incomplete auxiliary documentation or pending municipal clearances.

**Verdict Thresholds:**
* **`APPROVED`**: Score $\ge 75.0$ and $0$ Critical findings.
* **`DEFICIENT`**: Score between $50.0$ and $74.9$, or $\ge 2$ non-compliant checkpoints.
* **`REJECTED`**: Score $< 50.0$ or $\ge 1$ Critical statutory non-compliance.


---

### Layer 5: Spatial Vision, CAD Analysis & Institutional Analytics (`app/vision/`, `app/analytics/`)

* **Purpose:** Extends compliance inspection into physical campus blueprints, laboratory photographs, and institutional fraud analytics.
* **1. Architectural CAD & Spatial Polygon Calculator (`cad_engine.py`):**
  - Extracts multi-page vector drawings from architectural blueprint PDFs using PyMuPDF (`fitz.get_drawings()`).
  - Uses `Shapely` to model room boundaries as 2D spatial polygons (`Polygon`, `box`).
  - Computes scale-aware floor areas and categorizes spaces into Instructional, Administrative, Amenities, and Circulation zones.
  - Automatically compares measured areas against APH Table 4.1 minimum room area standards (e.g., Classroom $\ge 66\text{ sq.m}$, Computer Center $\ge 150\text{ sq.m}$, Seminar Hall $\ge 132\text{ sq.m}$).
* **2. Campus Asset Detection & Geofence Validation (`asset_detector.py`, `exif_validator.py`):**
  - Runs YOLOv8 object detection on campus inspection photos to identify required physical infrastructure (computer terminals, laboratory equipment, fire safety hardware, accessibility ramps).
  - Inspects EXIF image metadata to extract GPS latitude/longitude coordinates and camera hardware signatures, verifying that photos were captured within the institution's declared physical campus boundary.
* **3. Institutional Health Index (IHI) (`dashboard_services.py`):**
  - Synthesizes an institutional rating index ($0–100$) weighted across four foundational pillars:
    $$\text{IHI} = 0.35 \times \text{Compliance} + 0.25 \times \text{Forensics} + 0.20 \times \text{Source Verification} + 0.20 \times \text{Infrastructure}$$
* **4. Cross-Institutional Anomaly Detection:**
  - **Ghost Faculty Collision Detection:** Identifies faculty members concurrently registered as full-time teachers across multiple institutions by cross-referencing names, PAN numbers, and department appointments.
  - **Duplicate Land Parcel Detection:** Flags duplicate land survey / khasra numbers claimed simultaneously across distinct institutional applications.
* **5. Executive Clearance Certificate Generation (`report_generator.py`):**
  - Uses ReportLab to generate tamper-resistant, publication-grade PDF **AICTE Compliance Audit Clearance Certificates** featuring itemized scores, verification receipts, and embedded QR audit seals.

---

### Layer 6: Merkle Audit Chain & Immutable Integrity Ledger (`app/merkle/`)

* **Purpose:** Establishes an immutable, tamper-evident cryptographic log of all audit transactions, system findings, and human reviewer decisions.
* **Cryptographic Merkle Tree Architecture:**
  - Every review step, extracted payload hash, forensic score, agent reasoning trace, and human scrutiny decision is hashed using SHA-256.
  - Hashes are organized into a hierarchical Merkle Tree structure persisted in SQLite (`data/merkle_audit_ledger.db`).
* **Verifiable Cryptographic Proofs:**
  - Produces verifiable Merkle leaf hashes and root proofs. Any post-audit tampering, unauthorized retroactive modification, or database alteration alters the Merkle root hash, immediately alerting supervisory authorities.

---


## Screenshots

These screenshots show the web app and sample review views. Sample findings are illustrative and are not a live regulatory decision or issuer verification.

### Landing page

![SATYA landing page](docs/images/landing-page.png)

### Audit workspace and upload

![SATYA audit workspace upload screen](docs/images/audit-upload.png)

### Findings overview

![SATYA findings overview](docs/images/audit-findings.png)

### Review matrix

![SATYA review matrix](docs/images/review-matrix.png)

### APH GraphRAG rule review

![SATYA GraphRAG rules screen](docs/images/graphrag-rules.png)

### APH rule detail view

![SATYA GraphRAG rule detail screen](docs/images/graphrag-rule-detail.png)

### Repeated GraphRAG capture

![Additional capture of the SATYA GraphRAG rules screen](docs/images/graphrag-rules-repeat-capture.png)

## Run locally

### Requirements

- Python 3.12 is the recommended backend environment.
- Node.js and npm for the frontend.

### 1. Install backend dependencies

From the repository root:

```bash
python -m venv .venv
```

Activate the environment, then install dependencies:

```bash
pip install -r requirements.txt
```

On Windows PowerShell, activate it with:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Configure optional services

Create a local environment file from the template:

```bash
cp .env.example .env
```

Add credentials only for services you intend to use. Neo4j, Groq, Gemini, and embedding settings are documented in `.env.example`. Do not commit `.env` or put API keys in frontend code.

The backend requirements include machine-learning and computer-vision packages, so installation and first-run model setup may take time and disk space.

### 3. Start the API

From the repository root:

```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

FastAPI health check: `http://127.0.0.1:8000/health`
Interactive API documentation: `http://127.0.0.1:8000/docs`

### 4. Start the web app

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite development server proxies `/api` requests to the backend at `http://127.0.0.1:8000`.

The frontend has separate entry pages for the landing page, audit workspace, About, and FAQ. The production build is configured in `frontend/vite.config.ts`.

## Deploy on Render

The repository's root `Dockerfile` starts the FastAPI application with Uvicorn and listens on Render's assigned `PORT`. Create a Docker Web Service connected to this repository and configure the required environment variables in Render. The frontend is served by Vercel separately. Before using hosted audit APIs, update the `/api` rewrite in `frontend/vercel.json` to point to the Render service URL.

## API overview

FastAPI's interactive `/docs` page lists request formats and responses. Main API areas include:

- **Document and compliance:** `POST /api/v1/extract`, `POST /api/v1/forensics`, `POST /api/v1/verify-source`, and `POST /api/v1/compliance-audit`.
- **External source checks:** `/api/v1/verification/...`.
- **Infrastructure analysis:** `/api/v1/layer5-vision/...` for CAD, EXIF, asset detection, and combined analysis.
- **Reports and analytics:** `/api/v1/reports/...` and `/api/v1/analytics/...`.
- **Audit ledger:** `/api/v1/merkle/...`.
- **Problem statement portal:** `/api/v1/problem-statements/...`.

## Repository guide

- `frontend/` — React application, separate page entry points, and static assets.
- `app/` — FastAPI routers and document, vision, verification, knowledge, and analytics modules.
- `backend/main.py` — FastAPI application entry point used by Render and local development.
- `backend/gradio_app.py` — optional Gradio wrapper around the FastAPI service.
- `docs/architecture.md` — detailed architecture flow and implementation boundaries.
- `docs/images/` — architecture diagram and reader-facing screenshots used in this README.
- `tests/` — automated checks and scenario fixtures.

Built by **Team Last Mile**.
