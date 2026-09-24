from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import os
from pathlib import Path

app = FastAPI()

# Use absolute paths based on the file's location
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "public" / "data" / "mocks"
DIST_DIR = BASE_DIR / "dist"

@app.get("/api/mocks/{filename}")
async def get_mock_data(filename: str):
    file_path = DATA_DIR / f"{filename}.json"
    if not file_path.exists():
        return {"error": "File not found"}, 404
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

# Serve the frontend build folder
# We check if the directory exists first to prevent the server from crashing
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"))
    app.mount("/", StaticFiles(directory=DIST_DIR, html=True))
else:
    print(f"WARNING: Frontend build directory not found at {DIST_DIR}. Static files will not be served.")

@app.get("/")
async def read_index():
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"error": "Frontend build not found. Please run 'npm run build' first."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
