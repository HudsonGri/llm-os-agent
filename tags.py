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
from dotenv import load_dotenv
import random
from google.ai.generativelanguage_v1beta.types import content

# --- Configuration ---s

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

# Define the question generation prompt
QUESTION_PROMPT = """
Generate 3 questions that a student might ask about the following content. 
The questions should test understanding of key concepts. The questions should be short and simple.
Format the output as a JSON array of question objects with the following structure:
[
    {
        "question": "The actual question text",
        "topic": "Brief topic/theme of the question"
    }
]
Content:
"""

def create_prompt_questions_table():
    """Create the prompt_questions table if it doesn't exist."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS prompt_questions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                resource_id VARCHAR(191) REFERENCES resources(id),
                question TEXT NOT NULL,
                topic TEXT NOT NULL,
                active BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
    except Exception as e:
        print(f"Database error creating table: {e}")
        sys.exit(1)
    finally:
        if conn:
            cur.close()
            conn.close()

def get_all_resources() -> list:
    """Get all resources from the resources table."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT id, content 
            FROM resources
        """)
        
        resources = cur.fetchall()
        return resources
        
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)
    finally:
        if conn:
            cur.close() 
            conn.close()

def generate_questions(res_content: str) -> list:
    """Generate questions about the content using Gemini."""
    try:
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
            "response_schema": content.Schema(
                type=content.Type.ARRAY,
                items=content.Schema(
                    type=content.Type.OBJECT,
                    properties={
                        "question": content.Schema(type=content.Type.STRING),
                        "topic": content.Schema(type=content.Type.STRING)
                    }
                )
            ),
            "response_mime_type": "application/json"
        }

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
        )

        chat = model.start_chat(history=[])
        response = chat.send_message(f"{QUESTION_PROMPT}\n\n{res_content}")

        print(response.text)
        
        # Parse JSON response
        questions = json.loads(response.text)
        return questions

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        sys.exit(1)

def save_questions_to_db(resource_id: str, questions: list):
    """Save generated questions to the database."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Prepare question rows
        question_rows = [
            (resource_id, q["question"], q["topic"]) 
            for q in questions
        ]
        
        # Bulk insert questions
        execute_values(cur, """
            INSERT INTO prompt_questions (resource_id, question, topic)
            VALUES %s
        """, question_rows)
        
        conn.commit()
        print(f"Saved {len(questions)} questions to database")
        
    except Exception as e:
        print(f"Database error saving questions: {e}")
        sys.exit(1)
    finally:
        if conn:
            cur.close()
            conn.close()

def main():
    # Create table if it doesn't exist
    create_prompt_questions_table()
    
    # Get all resources
    print("Fetching all resources...")
    resources = get_all_resources()
    
    # Process each resource
    for resource_id, content in resources:
        print(f"\nProcessing resource {resource_id}...")
        
        # Generate questions
        print("Generating questions...")
        questions = generate_questions(content)
        
        # Save to database
        print("Saving questions to database...")
        save_questions_to_db(resource_id, questions)
    
    print("\nAll resources processed!")

if __name__ == "__main__":
    main()
