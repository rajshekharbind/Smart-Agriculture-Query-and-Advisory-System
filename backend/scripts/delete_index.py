import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pinecone import Pinecone

from backend.app.config import ROOT_DIR as _  # loads .env

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

print("Current indexes:")
indexes = pc.list_indexes()
for index in indexes:
    print(f"- {index['name']} (dimension: {index['dimension']}, metric: {index['metric']})")

target_index = os.getenv("PINECONE_INDEX_NAME")
indexes_to_delete = [target_index] if target_index else []
for index_name in indexes_to_delete:
    if index_name in [idx["name"] for idx in indexes]:
        print(f"\nDeleting index: {index_name}")
        pc.delete_index(index_name)
        print(f"Index {index_name} deleted successfully")
