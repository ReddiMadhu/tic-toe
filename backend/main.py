from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import properties, submissions, process, results, leaderboard, triage

# Load .env file for SMTP credentials and other settings
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(title="Underwriting Intelligence API", version="1.0.0")

# CORS — allow the Vite dev server and any origin for demo purposes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Mount routers
app.include_router(properties.router,   prefix="/api/properties",  tags=["properties"])
app.include_router(submissions.router,  prefix="/api/submissions", tags=["submissions"])
app.include_router(process.router,      prefix="/api/process",     tags=["process"])
app.include_router(results.router,      prefix="/api/results",     tags=["results"])
app.include_router(leaderboard.router,  prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(triage.router,       prefix="/api/triage",      tags=["triage"])


@app.get("/")
def root():
    return {"message": "Underwriting Intelligence API is running", "version": "1.0.0"}
