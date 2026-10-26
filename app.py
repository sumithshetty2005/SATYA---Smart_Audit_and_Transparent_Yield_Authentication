"""Hugging Face Spaces Entry Point for SATYA AICTE Compliance Engine."""

import gradio as gr
import uvicorn
from main import app as fastapi_app

# Create a clean Gradio interface for Hugging Face Spaces
with gr.Blocks(title="SATYA — AICTE Compliance Engine API") as demo:
    gr.Markdown("# 🏛️ SATYA — Smart Audit and Transparent Yield Authentication")
    gr.Markdown("### AICTE Multi-Layer Compliance & Forensic Verification Engine")
    gr.Markdown("Status: 🟢 **FastAPI Service is Online and Serving Requests**")
    gr.Markdown("---")
    gr.Markdown("### 📡 API Documentation & Endpoints")
    gr.Markdown("- **Interactive Swagger UI**: [Click to Open `/docs`](/docs)")
    gr.Markdown("- **OpenAPI Specification**: [Click to Open `/openapi.json`](/openapi.json)")
    gr.Markdown("- **API Health Check**: [`/health`](/health)")

# Mount Gradio onto the existing FastAPI application
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=7860)
