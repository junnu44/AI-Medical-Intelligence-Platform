import pathlib
import os
import sys

db = pathlib.Path(sys.argv[0]).resolve().parent / "medical_ai.db"
if db.exists():
    os.remove(db)
    print("Deleted old database")
else:
    print("No database found")
