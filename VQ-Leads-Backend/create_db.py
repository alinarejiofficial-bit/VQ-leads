import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

dbname = os.getenv('DB_NAME', 'vq_leads_db')
user = os.getenv('DB_USER', 'postgres')
password = os.getenv('DB_PASSWORD', 'password')
host = os.getenv('DB_HOST', '127.0.0.1')
port = os.getenv('DB_PORT', '5432')

print(f"Connecting to PostgreSQL on {host}:{port} using username '{user}'...")
try:
    # Connect to the default admin database to run query
    conn = psycopg2.connect(dbname='postgres', user=user, password=password, host=host, port=port)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if target database exists
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{dbname}';")
    exists = cursor.fetchone()
    
    if not exists:
        print(f"Database '{dbname}' does not exist. Creating database...")
        cursor.execute(f"CREATE DATABASE {dbname};")
        print(f"Database '{dbname}' created successfully!")
    else:
        print(f"Database '{dbname}' already exists.")
        
    cursor.close()
    conn.close()
except Exception as e:
    print(f"\n[PostgreSQL Connection Error] {e}")
    print("Please verify PostgreSQL service is running and credentials in '.env' are correct.")
