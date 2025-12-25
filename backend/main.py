from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import assessments, use_cases, governance, value_tracking, blueprints, learning

app = FastAPI(
    title="AI-OS API",
    description="API for the AI Transformation Operating System",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(assessments.router, prefix="/api/assessments", tags=["Assessments"])
app.include_router(use_cases.router, prefix="/api/use-cases", tags=["Use Cases"])
app.include_router(governance.router, prefix="/api/governance", tags=["Governance"])
app.include_router(value_tracking.router, prefix="/api/value", tags=["Value Tracking"])
app.include_router(blueprints.router, prefix="/api/blueprints", tags=["Blueprints"])
app.include_router(learning.router, prefix="/api/learning", tags=["Learning"])


@app.get("/")
async def root():
    return {"message": "Welcome to AI-OS API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
