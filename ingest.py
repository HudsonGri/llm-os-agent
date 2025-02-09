#!/usr/bin/env python3
import os
import sys
import re
import uuid
import json
import google.generativeai as genai
from openai import OpenAI
import psycopg2
from psycopg2.extras import execute_values
from PyPDF2 import PdfReader
from pptx import Presentation
from dotenv import load_dotenv

# --- Configuration ---

# Load environment variables from .env file
load_dotenv()

# Set your OpenAI API key and database URL via environment variables.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not OPENAI_API_KEY or not DATABASE_URL or not GEMINI_API_KEY:
    print("Please set the OPENAI_API_KEY, GEMINI_API_KEY and DATABASE_URL environment variables.")
    sys.exit(1)

openai_client = OpenAI(api_key=OPENAI_API_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Define the chunking prompt (as described in the article)
CHUNKING_PROMPT = (
    "OCR the following page into Markdown. Tables should be formatted as HTML. "
    "Do not sorround your output with triple backticks.\n\n"
    "Chunk the document into sections of roughly 250 - 1000 words. Our goal is \n"
    "to identify parts of the page with same semantic theme. These chunks will \n"
    "be embedded and used in a RAG pipeline. \n\n"
    "Surround the chunks with <chunk> </chunk> html tags."
)

# --- PDF Extraction ---

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from all pages of the PDF."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text.strip()

# --- PPTX Extraction ---

def extract_text_from_pptx(pptx_path: str) -> str:
    """Extract text from all slides of the PPTX, including speaker notes."""
    presentation = Presentation(pptx_path)
    full_text = []
    for slide in presentation.slides:
        slide_text = ""
        for shape in slide.shapes:
            if hasattr(shape, "text") and shape.text:
                slide_text += shape.text + "\n"
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            slide_text += "Speaker Notes: " + slide.notes_slide.notes_text_frame.text + "\n"
        full_text.append(slide_text)
    return "\n".join(full_text).strip()

# --- Gemini Flash 2.0 Chunking ---
def chunk_text_with_gemini(text: str) -> list:
    """
    Send the extracted text and chunking prompt to Gemini Flash 2.0.
    Expected output: a markdown string containing one or more <chunk>...</chunk> sections.
    """
    try:
        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
        )

        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(f"{CHUNKING_PROMPT}\n\n{text}")
        chunked_text = response.text

        # Save raw chunked text to file for debugging
        with open("chunks_debug.txt", "w") as f:
            f.write(chunked_text)

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        sys.exit(1)
    
    # Extract chunks enclosed in <chunk>...</chunk> tags using regex.
    chunks = re.findall(r"<chunk>(.*?)</chunk>", chunked_text, re.DOTALL)
    if not chunks:
        print("No chunks found in the Gemini response. Check the API output.")
        sys.exit(1)

    # Save extracted chunks to file for debugging
    with open("extracted_chunks.txt", "w") as f:
        for i, chunk in enumerate(chunks):
            f.write(f"\n--- Chunk {i+1} ---\n")
            f.write(chunk.strip())
            f.write("\n")

    return [chunk.strip() for chunk in chunks if chunk.strip()]

# --- Embedding Generation ---

def generate_embedding(text: str) -> list:
    """Generate an embedding vector for a given text using OpenAI."""
    try:
        response = openai_client.embeddings.create(
            input=text.replace("\n", " "),
            model="text-embedding-ada-002"
        )
        # The API returns a list in response['data'][0]['embedding']
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        sys.exit(1)

# --- Database Insertion ---

def store_resource_and_embeddings(full_text: str, chunks: list, embeddings: list):
    """
    Insert a new resource (course slide content) into the resources table,
    and then insert each chunk along with its embedding into the embeddings table.
    """
    resource_id = str(uuid.uuid4())
    # Prepare the embeddings rows as tuples: (id, resource_id, content, embedding)
    embedding_rows = []
    for chunk, emb in zip(chunks, embeddings):
        emb_id = str(uuid.uuid4())
        # Convert embedding list to PostgreSQL array literal (e.g., '[0.1,0.2,...]')
        emb_array = "[" + ",".join(map(str, emb)) + "]"
        embedding_rows.append((emb_id, resource_id, chunk, emb_array))

    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        # Insert resource record.
        # Assumes the "resources" table has columns: id, content, created_at, updated_at.
        cur.execute(
            """
            INSERT INTO resources (id, content)
            VALUES (%s, %s)
            """,
            (resource_id, full_text,)
        )

        # Bulk insert into the embeddings table.
        # Assumes the "embeddings" table has columns: id, resource_id, content, embedding.
        insert_query = """
            INSERT INTO embeddings (id, resource_id, content, embedding)
            VALUES %s
        """
        execute_values(cur, insert_query, embedding_rows)
        print("Resource and embeddings successfully stored.")
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)
    finally:
        if conn:
            cur.close()
            conn.close()

# --- Main Ingestion Pipeline ---

def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_pdf.py <path_to_file>")
        sys.exit(1)
    file_path = sys.argv[1]

    print(f"Extracting text from {file_path} ...")
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    if ext == ".pdf":
        full_text = extract_text_from_pdf(file_path)
    elif ext == ".pptx":
        full_text = extract_text_from_pptx(file_path)
    else:
        print("Unsupported file type. Please provide a PDF or PPTX file.")
        sys.exit(1)
    
    print("Chunking text with Gemini Flash 2.0 ...")
    chunks = chunk_text_with_gemini(full_text)
    print(f"Found {len(chunks)} chunks.")

    print("Generating embeddings for each chunk ...")
    embeddings = []
    for chunk in chunks:
        emb = generate_embedding(chunk)
        embeddings.append(emb)

    print("Storing resource and embeddings into the database ...")
    store_resource_and_embeddings(full_text, chunks, embeddings)

if __name__ == "__main__":
    main()
