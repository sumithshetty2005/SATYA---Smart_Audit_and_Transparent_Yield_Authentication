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

SATYA is a project that helps reviewers organize institutional application documents and inspect evidence relevant to the **AICTE Approval Process Handbook (APH) 2024–2027**. It brings document extraction, visual-forensics signals, source checks, rule references, infrastructure tools, and audit records into one review workflow.

The goal is to help an official see **what was checked, what evidence supports a finding, what could not be checked, and what may need follow-up**. SATYA is a decision-support project; its results do not replace an authorized officer's review or constitute an official AICTE decision.

SATYA was developed in response to AICTE problem statement **SH26261**. It is an independent project and is not commissioned, operated, or endorsed by AICTE.

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

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, GSAP, Three.js, Framer Motion, and Lucide icons.
- **Backend:** Python, FastAPI, and Pydantic.
- **Document and evidence processing:** PyMuPDF, LayoutLMv3/Transformers, OpenCV, Pillow, pdfminer.six, pyHanko, Shapely, and Ultralytics.
- **Regulatory retrieval and reasoning:** LangChain, LangGraph, BM25, sentence-transformers, optional Neo4j, and optional Groq or Google Gemini providers.
- **Reporting and integrity:** ReportLab, cryptography, SHA-256, SQLite for the Merkle audit ledger.

External services and model providers require their own configuration. Optional items in this list may fall back to local or rule-based behavior, or report as unavailable, depending on the code path and environment.

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
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
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

## Current scope and limitations

- The instant positive and risk walkthroughs use illustrative sample data. They are separate from a document-derived audit and are intended to demonstrate how the interface presents findings.
- DigiLocker and registry checks require an authorized, configured integration. Without one, the service reports that verification is unavailable; it does not mean a record passed or failed.
- CAD measurements depend on usable drawing geometry and a supplied or detected scale. If a scale or route cannot be established, an area or egress measurement should remain unassessed.
- Optional LLM, embedding, and graph services depend on local setup. The project can use fallbacks for some paths; a fallback is not the same as a live external verification.
- Dashboard and problem-statement information may be held in process memory, while the local Merkle ledger uses SQLite. This is not a claim of production-scale persistence or a public blockchain.
- SATYA is not an official AICTE service. Always confirm findings against original records, applicable official documents, and authorized review procedures.

## Repository guide

- `frontend/` — React application, separate page entry points, and static assets.
- `app/` — FastAPI routers and document, vision, verification, knowledge, and analytics modules.
- `main.py` — current root FastAPI application entry point.
- `docs/architecture.md` — detailed architecture flow and implementation boundaries.
- `docs/images/` — architecture diagram and reader-facing screenshots used in this README.
- `tests/` — automated checks and scenario fixtures.

## License

No license is specified in this repository at this time. Contact the project maintainers before reusing or redistributing the source.
