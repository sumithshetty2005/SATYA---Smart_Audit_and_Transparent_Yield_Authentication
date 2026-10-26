---
title: Aicte Compliance Backend
emoji: 📈
colorFrom: purple
colorTo: purple
sdk: gradio
sdk_version: 6.30.0
python_version: '3.12'
app_file: app.py
pinned: false
---

# SATYA — Smart Audit and Transparent Yield Authentication
### AICTE Multi-Layer Compliance & Forensic Verification Engine

SATYA is an intelligent, multi-layered regulatory auditing and document integrity platform designed to automate and verify institutional applications under the **AICTE Approval Process Handbook (APH 2024–2027)**.

---

## 🏛️ Architecture Overview

See the [SATYA architecture diagram](docs/architecture.md) for the current application components, audit flow, data stores, and prototype/integration boundaries. The API exposes layered capabilities, but a document does not automatically pass through every layer in one request.

### Layer 1: Document Ingestion & Layout Analysis (`app/ingestion/`)
- Powered by `microsoft/layoutlmv3-base`.
- Tokenizes page renders, extracts 2D bounding boxes, and classifies regions (headers, key-value tables, institution details, faculty rosters).

### Layer 2: Visual Forensics Engine (`app/forensics/`)
- **Error Level Analysis (ELA)**: Re-compression differential matrices to expose digital splicing and forged seals.
- **Laplacian Edge Inspection**: Detects localized text smoothing, erasure, and synthetic flattening.
- **PDF Metadata Forensics**: Revision history traversal, incremental updates, and modification timestamps.

### Layer 3: Authoritative Source Verification (`app/verification/`)
- **Cryptographic PKI Signatures**: Incremental X.509 certificate parsing, digital signature integrity, and post-signing alteration detection.
- **2D QR Code Validation**: Native PyMuPDF & OpenCV QR detection with authoritative government domain resolution (`*.aicte-india.org`, `*.gov.in`).

### Layer 4: Agentic GraphRAG & Regulatory Engine (`app/knowledge/`)
- **Structure-Aware Chunking**: Hierarchical parsing of chapters, sections, tables, and clauses (~500–800 tokens, 10–15% overlap).
- **Neo4j Knowledge Graph**: Seeds regulatory entities (`:RegulatoryClause`, `:Programme`, `:ApplicationType`, `:Requirement`, `:LocationType`, `:Exception`, `:Level`, `:TERFee`) and directed relationships (`:MANDATES`, `:GOVERNED_BY`, `:HAS_EXCEPTION`, `:APPLIES_TO`, `:OFFERS_LEVEL`, `:REQUIRES_FEE`).
- **Hybrid Retrieval & RRF**: Dual-path BM25 exact matching + BGE-M3 1024-dimensional dense vector embeddings fused via Reciprocal Rank Fusion ($k=60$).
- **LangGraph Multi-Agent Orchestration**:
  - `Retriever Agent`: Queries hybrid stores and executes controlled 1- to 2-hop Neo4j traversals dynamically filtered on application facts.
  - `Compliance Evaluator Agent`: Audits Layer 1–3 outputs against APH statutory formulas.
  - `Audit Synthesizer Agent`: Synthesizes final regulatory verdicts citing exact APH clauses.
- **Dual LLMs**: Primary Groq Llama 3.1 8B Instruct (`langchain-groq`) with automatic Google Gemini API fallback (`langchain-google-genai`) and deterministic offline evaluation.

### Layer 5: Analytics, Audit Reporting & Dashboard Integration (`app/analytics/`)
- **LayerFiveAnalyticsEngine (`report_generator.py`)**:
  - Multi-layer synthesis producing unified `LayerFiveAuditReport` (JSON) and official publication-grade **AICTE Compliance Audit Clearance Certificates** (PDF) via ReportLab and PyMuPDF drawing.
  - Includes receipt tracking UUID, timestamp, institution details, multi-layer trust score, and itemized breakdown tables for Visual Forensics (L2), Source Verification (L3), and GraphRAG Citations (L4).
- **Institutional Health Index (IHI) (`dashboard_services.py`)**:
  - Multi-factor historical/departmental performance scoring (Regulatory Compliance 35%, Forensic Authenticity 25%, Cryptographic Provenance 20%, Cadre/Infrastructure Stability 20%) with letter grades (`A+`, `A`, `B`, `C`).
- **Cross-Institutional Anomaly Detection (`dashboard_services.py`)**:
  - **Duplicate Land Parcel Detection**: Flags duplicate survey/plot/khasra numbers claimed across distinct institutions (double-pledging).
  - **Ghost Faculty Collision Detection**: Flags concurrent full-time faculty appointments registered across distinct colleges.
- **Frontend Dashboard Service**: Aggregates approval rates, risk level distribution, active anomalies, and recent audit feeds.

---

## 🚀 Quickstart & Setup

### 1. Installation
```bash
git clone https://github.com/sumithshetty2005/SATYA---Smart_Audit_and_Transparent_Yield_Authentication.git
cd SATYA---Smart_Audit_and_Transparent_Yield_Authentication
pip install -r requirements.txt
```

### 2. Configuration
Copy the template configuration:
```bash
cp .env.example .env
```
Set your credentials in `.env` (Optional — engine runs in deterministic offline mode if keys are absent):
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Run FastAPI Application
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation: `http://localhost:8000/docs`

---

## 🧪 Testing & Regulatory Evaluations

Run the core compliance test suite:
```bash
python -m pytest tests/test_compliance.py
```

Run the Layer 5 analytics, reporting & anomaly test suite:
```bash
python -m pytest tests/test_layer5_analytics.py
```

Run the 8 APH 2024-2027 scenario evaluation benchmarks:
```bash
python tests/test_eval_scenarios.py
```

---

## 📡 API Endpoints

- `POST /api/v1/extract`: Layer 1 LayoutLMv3 document extraction.
- `POST /api/v1/forensics`: Layer 2 Visual Error Level Analysis & edge tampering detection.
- `POST /api/v1/verify-source`: Layer 3 Authoritative PKI & 2D QR verification.
- `POST /api/v1/compliance-audit`: Layer 4 Consolidated Agentic GraphRAG Regulatory Audit.
- `POST /api/v1/reports/generate`: Layer 5 Synthesizes consolidated audit clearance report (JSON).
- `POST /api/v1/reports/generate-pdf`: Layer 5 Streams official publication-grade AICTE Compliance Certificate (PDF).
- `GET /api/v1/reports/download-pdf`: Layer 5 Downloads pre-generated audit certificate by Report ID.
- `GET /api/v1/analytics/dashboard-summary`: Layer 5 Aggregated dashboard statistics, approval rates, and anomaly alerts.
- `GET /api/v1/analytics/anomalies`: Layer 5 List of detected cross-institutional land/faculty collisions.
- `GET /api/v1/analytics/health-index`: Layer 5 Institutional Health Index (IHI) rankings and recommendations.
- `GET /api/v1/problem-statements`: Problem Statement Provider Portal challenge list with multi-parameter filtering.
- `POST /api/v1/problem-statements/submit-ticket`: "Ticket-Flow" Challenge queueing with real-time AICTE regulatory pre-check.
- `GET /api/v1/problem-statements/stats`: Platform metrics and active grant totals.
- `POST /api/v1/problem-statements/{id}/apply`: Student/Innovator proposal submission endpoint.

---

## 🏛️ AICTE Problem Statement Provider Portal

The application includes a responsive web application celebrating the **Vedic Architectural Aesthetic** of the AICTE Approval Process Handbook (APH 2024–2027) cover, fused with **Squared-Inspired Card Motion Architecture**:

- **Vedic Aesthetic**: Vintage parchment texture, distressed gold leaf filigree borders, Maharishi Baudhayana (800 BCE) cutout, Sulba-Sutra Sanskrit Shloka (`दीर्घचतुरस्रस्याक्ष्णया रज्जुः...`), and Pythagorean geometric proof diagram ($c^2 = a^2 + b^2$).
- **3D Gyroscopic Card System**: Tilt physics, multi-layer depth parallax (`translateZ`), dynamic cursor spotlight glow, and live interactive simulation canvases (`CardMediaReel`).
- **Ticket-Flow Module**: 4-step challenge creation wizard for Ministries, PSUs, and Industry with real-time card preview and SHA-256 provenance verification receipt.
- **Three.js WebGL Engine**: Ambient golden dust particles and rotating 3D Sacred Geometry Mandala.

### Starting the Frontend & Backend:

```bash
# 1. Start FastAPI Backend (Port 8000)
python main.py

# 2. Start React + Vite Frontend (Port 5173 with auto-proxy to 8000)
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173` or `http://localhost:8000` to interact with the portal!
