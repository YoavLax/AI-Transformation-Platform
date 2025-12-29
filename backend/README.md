# AI-OS Backend

FastAPI backend for the AI-OS platform with PostgreSQL database.

## Prerequisites

- Python 3.9+
- PostgreSQL 14+ (or Docker for containerized PostgreSQL)

## Setup

### 1. PostgreSQL Database Setup

**Option A: Local PostgreSQL Installation**

```bash
# Create database
createdb ai_os

# Or via psql
psql -U postgres
CREATE DATABASE ai_os;
\q
```

**Option B: Docker (recommended for development)**

```bash
docker run --name ai-os-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_os \
  -p 5432:5432 \
  -d postgres:16
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_os
```

### 3. Python Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

The server will automatically create all database tables on startup.

## Database Management

### Running Migrations (Alembic)

For schema changes in production:

```bash
# Initialize alembic (first time only)
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Reset Database

```bash
# Drop and recreate (development only)
psql -U postgres -c "DROP DATABASE ai_os;"
psql -U postgres -c "CREATE DATABASE ai_os;"

# Tables will be recreated on next server start
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## Architecture

```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database connection and session management
├── db_models.py         # SQLAlchemy table definitions
├── models.py            # Pydantic models for API validation
├── repositories/        # Data access layer (repository pattern)
│   ├── base.py          # Generic CRUD operations
│   ├── assessments.py
│   ├── use_cases.py
│   ├── governance.py
│   ├── value_tracking.py
│   ├── assistants.py
│   ├── initiatives.py
│   ├── maturity.py
│   ├── metrics.py
│   └── learning.py
└── routes/              # API route handlers
    ├── assessments.py
    ├── use_cases.py
    ├── governance.py
    ├── value_tracking.py
    ├── assistants.py
    ├── initiatives.py
    ├── maturity.py
    ├── metrics.py
    ├── learning.py
    ├── dashboard.py
    └── blueprints.py
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_os` |
