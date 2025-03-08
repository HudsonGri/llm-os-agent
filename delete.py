import os
import sys
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Please set the DATABASE_URL environment variables.")
    sys.exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()


    # Delete all entries from the resources table
    cur.execute("DELETE FROM resources")
    print("All entries deleted from resource, embeddings, and prompt_values tables")

except Exception as e:
        print(f"Database error: {e}")
finally:
    if conn:
        cur.close()
        conn.close()
