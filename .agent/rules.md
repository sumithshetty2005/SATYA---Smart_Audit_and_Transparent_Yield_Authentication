# AICTE Compliance System - Agent Execution Rules

- **Tech Stack**: Python 3.10+, FastAPI, PyMuPDF, transformers, torch, Pillow, PaddleOCR, Pydantic v2.
- **Model**: Use `microsoft/layoutlmv3-base` for local token & bounding-box classification.
- **Architecture**: Keep schemas in `app/schemas/payload.py`, layout processing in `app/ingestion/layout_engine.py`, and endpoints in `main.py`.
- **Code Quality**: Include complete Python type hints and docstrings. Do not leave placeholder functions or `TODO` comments.