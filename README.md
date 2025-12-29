<div align="center">
  <img src="frontend/public/logo.png" alt="AI Transformation Platform Logo" width="200"/>
  
  # The AI Transformation Platform
</div>

A comprehensive web-based platform for enterprise AI transformation leaders, designed specifically for engineering departments and organizations looking to drive AI adoption at scale. The platform provides tools for maturity assessment, AI culture building, use case prioritization, governance, value tracking, architecture blueprints, and learning management.

## ✨ Vision

Empowering engineering teams to successfully navigate their AI transformation journey—from initial assessment through full organizational adoption with an AI-native culture.

---

## 📋 Features

### 1. Dashboard
- Organization-wide AI transformation overview
- Quick access to all modules
- Recent activity feed
- Key metrics and statistics

### 2. AI Assistants
- Manage AI tools, vendors, and licenses
- Track costs and utilization rates
- Monitor active users vs licenses
- Contract and renewal management

![AI Assistants](screenshots/Assistants.png)

### 3. AI Initiatives
- Initiative portfolio management
- Risk heatmap visualization
- Status tracking and progress monitoring
- Resource allocation insights

![AI Initiatives](screenshots/Initiatives.png)

### 4. Usage Metrics
- Comprehensive AI adoption analytics
- Team-level usage tracking
- Trend analysis and reporting
- Feature utilization breakdown

![Usage Metrics](screenshots/AI%20Usage.png)

### 5. Team Maturity Assessment
- 10-question assessment wizard covering 5 dimensions:
  - Data Readiness
  - Technology Infrastructure
  - Talent & Skills
  - Governance & Ethics
  - Business Alignment
- Interactive radar chart visualization
- Personalized recommendations
- Historical assessment tracking

![Team Maturity](screenshots/Team%20Maturity.png)

### 6. AI Culture 🏆
Critical milestones for building an AI-native organization:
- **AI Guild**: Cross-functional community of practice for AI practitioners
- **AI Workshops**: Regular hands-on sessions for skill building
- **AI Hackathons**: Innovation events to drive experimentation
- **AI Champions**: Embedded advocates in each engineering group
- Culture milestone tracking and progress visualization
- Engagement metrics and participation rates

![AI Culture](screenshots/AICulture.png)

### 7. Value Tracking
- KPI management and ROI tracking
- Engineering value metrics by team
- Time savings and productivity gains
- Target vs actual comparisons
- Trend charts and analytics

![Value Tracking](screenshots/Value.png)

### 8. Use Case Prioritization
- Use case intake form with scoring
- 2x2 prioritization matrix (Impact vs Feasibility)
- Grid and list views
- Status workflow (Draft → Submitted → Approved → In Progress → Completed)

### 9. Governance & Risk
- Model Cards for AI model documentation
- Risk assessment with categories:
  - Bias
  - Security
  - Compliance
  - Operational
  - Privacy
- Risk heatmap visualization
- Mitigation tracking

### 10. Architecture Blueprints
Production-ready reference architectures:
- RAG (Retrieval-Augmented Generation)
- Multi-Agent Systems
- MLOps Pipeline
- Real-Time AI Inference
- AI Data Pipeline
- Code Assistant Integration
- AI-Powered Testing

![Architecture Blueprints](screenshots/Blueprints.png)

### 11. Learning & Change Management
Role-based learning paths:
- **Executive**: AI Leadership & Strategy
- **Engineer**: AI/ML Engineering
- **Analyst**: AI-Assisted Analysis
- **Project Manager**: AI Project Management

Change management templates:
- Communication templates
- Stakeholder analysis
- Adoption checklists
- Training program outlines

![Learning](screenshots/Lrearning.png)

---

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State**: React useState + localStorage

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: PostgreSQL 16 (via Docker)
- **ORM**: SQLAlchemy 2.0+
- **Validation**: Pydantic
- **Server**: Uvicorn

### Database
- **PostgreSQL 16**: Production-ready relational database
- **SQLAlchemy**: ORM with JSONB support for flexible data
- **Repository Pattern**: Clean data access layer
- **Docker Compose**: Easy local development setup

---

## 🏗️ Architecture

### Frontend (Next.js)
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── assistants/        # AI Assistants management
│   │   ├── initiatives/       # AI Initiatives tracking
│   │   ├── metrics/           # Usage Metrics
│   │   ├── maturity/          # Team Maturity Assessment
│   │   ├── culture/           # AI Culture milestones
│   │   ├── value/             # Value Tracking
│   │   ├── use-cases/         # Use Case Prioritization
│   │   ├── governance/        # Governance & Risk
│   │   ├── blueprints/        # Architecture Blueprints
│   │   └── learning/          # Learning & Change
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Layout components
│   │   ├── charts/            # Chart components (Recharts)
│   │   └── shared/            # Shared components
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   ├── storage.ts         # localStorage helpers
│   │   └── api.ts             # API client
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
└── tailwind.config.ts
```

### Backend (FastAPI)
```
backend/
├── main.py                     # FastAPI app entry point
├── models.py                   # Pydantic models
├── database.py                 # SQLAlchemy database connection
├── db_models.py                # SQLAlchemy ORM models
├── requirements.txt
├── .env.example                # Environment template
├── repositories/               # Data access layer
│   ├── base.py                # Base repository class
│   ├── assessments.py         # Assessment repository
│   ├── use_cases.py           # Use case repository
│   ├── governance.py          # Governance repository
│   ├── value_tracking.py      # Value tracking repository
│   ├── assistants.py          # Assistants repository
│   ├── initiatives.py         # Initiatives repository
│   ├── maturity.py            # Maturity repository
│   ├── metrics.py             # Metrics repository
│   └── learning.py            # Learning repository
└── routes/
    ├── assessments.py         # Assessment endpoints
    ├── use_cases.py           # Use case endpoints
    ├── governance.py          # Governance endpoints
    ├── value_tracking.py      # Value tracking endpoints
    ├── blueprints.py          # Blueprint endpoints
    ├── assistants.py          # Assistants endpoints
    ├── initiatives.py         # Initiatives endpoints
    ├── maturity.py            # Maturity endpoints
    ├── metrics.py             # Metrics endpoints
    ├── dashboard.py           # Dashboard endpoints
    └── learning.py            # Learning endpoints
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker (for PostgreSQL database)

### Setup

#### 1. Start the Database (PostgreSQL via Docker)
```bash
# From the project root
docker-compose up -d
```

This starts a PostgreSQL 16 container with:
- **Database**: `ai_os`
- **User**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`

#### 2. Configure Backend Environment
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work with Docker setup)
```

#### 3. Start the Backend (FastAPI)
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate  # Windows
# or: source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. Start the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### Quick Start (After Initial Setup)
```bash
# Terminal 1: Database (if not already running)
docker-compose up -d

# Terminal 2: Backend
cd backend && .venv/Scripts/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Frontend  
cd frontend && npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

### Verify Database Connection
```bash
# Check PostgreSQL is running
docker exec ai-os-postgres psql -U postgres -d ai_os -c "\dt"

# View data in tables
docker exec ai-os-postgres psql -U postgres -d ai_os -c "SELECT * FROM ai_assistants;"
```

---

## 🔧 Development

### Adding New Components
1. Create component in `src/components/`
2. Export from appropriate index file
3. Use Tailwind CSS for styling

### Adding New API Routes
1. Create route file in `backend/routes/`
2. Define Pydantic models in `backend/models.py`
3. Register router in `backend/main.py`

### Building for Production
```bash
cd frontend
npm run build
```

Note: Set `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` if you encounter TLS certificate issues with Google Fonts.

---

## 📝 Notes

- **Data Persistence**: Data is stored in PostgreSQL database. Frontend also caches data in localStorage for offline resilience and syncs to the API.
- **Authentication**: Not implemented. Add authentication before production use.
- **Database Backup**: For production, configure regular PostgreSQL backups.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@127.0.0.1:5432/ai_os` |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) | `http://localhost:8000` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details.

---

<p align="center">
  <strong>The AI Transformation Platform</strong><br>
  Empowering engineering teams to build AI-native organizations
</p>
