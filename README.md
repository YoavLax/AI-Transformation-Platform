<div align="center">
  <img src="frontend/public/logo.png" alt="AI Transformation Platform Logo" width="200"/>
  
  # The AI Transformation Platform
</div>

A comprehensive web-based platform for enterprise AI transformation leaders, designed specifically for engineering departments and organizations looking to drive AI adoption at scale. The platform provides tools for maturity assessment, AI culture building, use case prioritization, governance, value tracking, architecture blueprints, and learning management.

## ✨ Vision

Empowering engineering teams to successfully navigate their AI transformation journey—from initial assessment through full organizational adoption with an AI-native culture.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+

### Running the Application

**Option 1: Run Both Servers**

Open two terminal windows:

**Terminal 1 - Backend (FastAPI)**:
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate  # Windows
# or: source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend (Next.js)**:
```bash
cd frontend
npm install
npm run dev
```

**Option 2: Quick Start Script (after initial setup)**:
```bash
# Terminal 1: Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2: Frontend  
cd frontend && npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc (ReDoc)

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

### 3. AI Initiatives
- Initiative portfolio management
- Risk heatmap visualization
- Status tracking and progress monitoring
- Resource allocation insights

### 4. Usage Metrics
- Comprehensive AI adoption analytics
- Team-level usage tracking
- Trend analysis and reporting
- Feature utilization breakdown

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

### 6. AI Culture 🏆
Critical milestones for building an AI-native organization:
- **AI Guild**: Cross-functional community of practice for AI practitioners
- **AI Workshops**: Regular hands-on sessions for skill building
- **AI Hackathons**: Innovation events to drive experimentation
- **AI Champions**: Embedded advocates in each engineering group
- Culture milestone tracking and progress visualization
- Engagement metrics and participation rates

### 7. Value Tracking
- KPI management and ROI tracking
- Engineering value metrics by team
- Time savings and productivity gains
- Target vs actual comparisons
- Trend charts and analytics

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
├── requirements.txt
└── routes/
    ├── assessments.py         # Assessment endpoints
    ├── use_cases.py           # Use case endpoints
    ├── governance.py          # Governance endpoints
    ├── value_tracking.py      # Value tracking endpoints
    ├── blueprints.py          # Blueprint endpoints
    └── learning.py            # Learning endpoints
```

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
- **Validation**: Pydantic
- **Server**: Uvicorn
- **Storage**: In-memory (demo) / localStorage sync

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

- **Data Persistence**: Frontend uses localStorage for data persistence. Backend uses in-memory storage (resets on restart).
- **Authentication**: Not implemented. Add authentication before production use.
- **Database**: No database configured. For production, add PostgreSQL/MongoDB.

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
