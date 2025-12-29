from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from models import (
    LearningModule, LearningPath, LearningRole, 
    ChangeTemplate, TemplateCategory
)
from database import get_db
from db_models import LearningProgressModel
from repositories import LearningRepository

router = APIRouter()

# Pre-populated learning paths
LEARNING_PATHS: dict[str, LearningPath] = {
    "executive": LearningPath(
        id="executive",
        title="Executive AI Leadership",
        role=LearningRole.executive,
        description="Strategic AI leadership for C-suite and senior executives",
        modules=[
            LearningModule(
                id="exec-1",
                title="AI Strategy Fundamentals",
                role=LearningRole.executive,
                description="Understanding AI's strategic impact on business",
                content="""
# AI Strategy Fundamentals for Executives

## Learning Objectives
- Understand AI capabilities and limitations
- Identify strategic AI opportunities
- Evaluate AI investment decisions

## Key Concepts

### What AI Can and Cannot Do
AI excels at pattern recognition, prediction, and automation of well-defined tasks.
It struggles with common sense reasoning, novel situations, and ethical judgment.

### Strategic Frameworks
1. **Value Chain Analysis**: Where can AI create value?
2. **Competitive Dynamics**: How will AI reshape your industry?
3. **Build vs Buy vs Partner**: Choosing the right approach

### Investment Considerations
- Total Cost of Ownership (TCO)
- Time to Value
- Risk Assessment
- Talent Requirements

## Discussion Questions
1. Where are your biggest pain points that AI could address?
2. What data assets do you have that could fuel AI initiatives?
3. Who are your AI competitors and what are they doing?
""",
                duration=45,
                completed=False
            ),
            LearningModule(
                id="exec-2",
                title="AI Governance & Ethics",
                role=LearningRole.executive,
                description="Leading responsible AI implementation",
                content="""
# AI Governance & Ethics for Leaders

## Learning Objectives
- Understand AI risks and mitigation strategies
- Establish governance frameworks
- Lead ethical AI initiatives

## Key Concepts

### AI Risk Categories
1. **Operational Risk**: Model failures, downtime
2. **Compliance Risk**: Regulatory violations
3. **Reputational Risk**: Bias, unfairness
4. **Security Risk**: Adversarial attacks, data breaches

### Governance Framework
- AI Ethics Board
- Model Review Process
- Incident Response
- Audit & Documentation

### Regulatory Landscape
- EU AI Act
- Industry-specific regulations
- Emerging requirements

## Action Items
1. Establish AI governance committee
2. Define AI principles for your organization
3. Implement model risk management
""",
                duration=30,
                completed=False
            ),
            LearningModule(
                id="exec-3",
                title="Building AI-Ready Organizations",
                role=LearningRole.executive,
                description="Organizational change for AI success",
                content="""
# Building AI-Ready Organizations

## Learning Objectives
- Assess organizational AI readiness
- Drive cultural change
- Structure AI teams effectively

## Key Concepts

### AI Readiness Pillars
1. **Data**: Quality, access, governance
2. **Technology**: Infrastructure, tools, platforms
3. **Talent**: Skills, training, hiring
4. **Culture**: Experimentation, data-driven decisions

### Operating Models
- Centralized AI CoE
- Federated/Hub-and-Spoke
- Fully Distributed

### Change Management
- Executive sponsorship
- Quick wins and pilots
- Scaling successful initiatives
- Continuous learning culture

## Assessment
Complete the AI Maturity Assessment to identify gaps.
""",
                duration=35,
                completed=False
            )
        ],
        progress=0
    ),
    "manager": LearningPath(
        id="manager",
        title="AI Project Management",
        role=LearningRole.manager,
        description="Managing AI projects and teams effectively",
        modules=[
            LearningModule(
                id="mgr-1",
                title="AI Project Lifecycle",
                role=LearningRole.manager,
                description="Understanding the unique aspects of AI projects",
                content="""
# AI Project Lifecycle Management

## Learning Objectives
- Understand AI project phases
- Manage AI project risks
- Set realistic expectations

## Key Concepts

### AI Project Phases
1. **Problem Definition**: What are we solving?
2. **Data Assessment**: What data do we have?
3. **Proof of Concept**: Can we solve it?
4. **MVP Development**: Minimum viable product
5. **Production Deployment**: Scaling and ops
6. **Monitoring & Iteration**: Continuous improvement

### Key Differences from Traditional Projects
- Uncertainty in outcomes
- Iterative experimentation
- Data dependency
- Ongoing maintenance needs

### Success Criteria
- Define clear, measurable KPIs
- Set realistic baselines
- Plan for iteration
""",
                duration=40,
                completed=False
            ),
            LearningModule(
                id="mgr-2",
                title="Cross-functional Team Leadership",
                role=LearningRole.manager,
                description="Leading diverse AI teams",
                content="""
# Leading Cross-functional AI Teams

## Learning Objectives
- Build effective AI teams
- Foster collaboration
- Manage stakeholders

## Key Concepts

### AI Team Roles
- Data Scientists
- ML Engineers
- Data Engineers
- Domain Experts
- Product Managers
- UX Designers

### Collaboration Patterns
- Agile for AI (CRISP-DM hybrid)
- Sprint planning with experiments
- Demo and feedback loops
- Technical debt management

### Stakeholder Management
- Setting expectations
- Communicating uncertainty
- Demonstrating progress
- Managing scope
""",
                duration=35,
                completed=False
            ),
            LearningModule(
                id="mgr-3",
                title="AI Product Development",
                role=LearningRole.manager,
                description="Building AI-powered products",
                content="""
# AI Product Development

## Learning Objectives
- Define AI product requirements
- Balance user needs with AI capabilities
- Plan product roadmaps

## Key Concepts

### AI Product Framework
1. User Problem → AI Solution fit
2. Data availability assessment
3. Accuracy vs latency tradeoffs
4. Explainability requirements
5. Feedback loop design

### MVP for AI Products
- Start with rules/heuristics
- Add ML incrementally
- Human-in-the-loop fallbacks
- A/B testing strategy

### Roadmap Planning
- Technical feasibility gates
- User validation milestones
- Scale considerations
""",
                duration=40,
                completed=False
            )
        ],
        progress=0
    ),
    "engineer": LearningPath(
        id="engineer",
        title="AI/ML Engineering",
        role=LearningRole.engineer,
        description="Technical skills for building production AI systems",
        modules=[
            LearningModule(
                id="eng-1",
                title="ML Fundamentals",
                role=LearningRole.engineer,
                description="Core machine learning concepts",
                content="""
# Machine Learning Fundamentals

## Learning Objectives
- Understand ML algorithms
- Apply appropriate techniques
- Evaluate model performance

## Key Concepts

### Algorithm Categories
1. **Supervised Learning**
   - Classification: Predict categories
   - Regression: Predict values

2. **Unsupervised Learning**
   - Clustering: Group similar items
   - Dimensionality reduction

3. **Deep Learning**
   - Neural networks
   - Transformers
   - Large Language Models

### Model Selection
- Problem type → Algorithm family
- Data characteristics
- Interpretability needs
- Computational constraints

### Evaluation Metrics
- Classification: Accuracy, Precision, Recall, F1
- Regression: MAE, RMSE, R²
- Ranking: NDCG, MRR
""",
                duration=60,
                completed=False
            ),
            LearningModule(
                id="eng-2",
                title="MLOps Practices",
                role=LearningRole.engineer,
                description="Production ML engineering",
                content="""
# MLOps Best Practices

## Learning Objectives
- Build reproducible ML pipelines
- Deploy models to production
- Monitor model performance

## Key Concepts

### MLOps Maturity Levels
0. Manual, script-based
1. ML pipeline automation
2. CI/CD for ML
3. Automated retraining

### Key Components
- Version control (Git, DVC)
- Experiment tracking (MLflow)
- Feature stores
- Model registries
- Serving infrastructure
- Monitoring & alerting

### Production Checklist
□ Model versioning
□ A/B testing capability
□ Rollback mechanism
□ Performance monitoring
□ Data drift detection
□ Retraining triggers
""",
                duration=50,
                completed=False
            ),
            LearningModule(
                id="eng-3",
                title="LLM Integration",
                role=LearningRole.engineer,
                description="Building with Large Language Models",
                content="""
# LLM Integration Patterns

## Learning Objectives
- Choose appropriate LLM strategies
- Implement RAG systems
- Optimize for cost and latency

## Key Concepts

### Integration Patterns
1. **Direct API calls**: Simple, expensive
2. **RAG**: Retrieval-augmented generation
3. **Fine-tuning**: Custom models
4. **Agents**: Autonomous systems

### RAG Architecture
- Document chunking strategies
- Embedding models
- Vector databases
- Retrieval optimization
- Prompt engineering

### Best Practices
- Prompt versioning
- Output validation
- Cost optimization
- Latency management
- Error handling
""",
                duration=55,
                completed=False
            )
        ],
        progress=0
    ),
    "analyst": LearningPath(
        id="analyst",
        title="AI-Assisted Analysis",
        role=LearningRole.analyst,
        description="Leveraging AI tools for enhanced analysis",
        modules=[
            LearningModule(
                id="ana-1",
                title="AI Tools for Analysts",
                role=LearningRole.analyst,
                description="Overview of AI tools for data analysis",
                content="""
# AI Tools for Data Analysis

## Learning Objectives
- Identify useful AI tools
- Apply AI to analysis workflows
- Validate AI-generated insights

## Key Concepts

### Tool Categories
1. **Data Preparation**
   - Automated cleaning
   - Feature engineering
   - Anomaly detection

2. **Analysis & Insights**
   - Natural language querying
   - Automated visualization
   - Pattern discovery

3. **Reporting**
   - AI writing assistants
   - Automated dashboards
   - Natural language summaries

### Popular Tools
- GitHub Copilot (coding)
- ChatGPT/Claude (analysis)
- Tableau AI (visualization)
- Power BI Copilot (reporting)

### Best Practices
- Always validate AI outputs
- Understand limitations
- Document AI usage
""",
                duration=30,
                completed=False
            ),
            LearningModule(
                id="ana-2",
                title="Prompt Engineering for Analysis",
                role=LearningRole.analyst,
                description="Effective prompting for analytical tasks",
                content="""
# Prompt Engineering for Analysts

## Learning Objectives
- Write effective prompts
- Structure complex queries
- Extract actionable insights

## Key Concepts

### Prompt Patterns
1. **Role Setting**: "You are a data analyst..."
2. **Context Provision**: Include relevant data
3. **Task Specification**: Clear instructions
4. **Format Request**: Structured outputs

### Analysis Prompts
```
Analyze this data and provide:
1. Key trends
2. Anomalies
3. Recommendations
Format as bullet points.
```

### Advanced Techniques
- Chain-of-thought prompting
- Few-shot examples
- Iterative refinement
- Output validation

### Common Pitfalls
- Ambiguous instructions
- Missing context
- Trusting without verification
""",
                duration=35,
                completed=False
            ),
            LearningModule(
                id="ana-3",
                title="Data Storytelling with AI",
                role=LearningRole.analyst,
                description="Creating compelling narratives from data",
                content="""
# Data Storytelling with AI

## Learning Objectives
- Structure data narratives
- Use AI for storytelling
- Present insights effectively

## Key Concepts

### Story Structure
1. **Hook**: Capture attention
2. **Context**: Set the scene
3. **Insight**: Key findings
4. **Impact**: Why it matters
5. **Action**: Recommendations

### AI-Assisted Storytelling
- Generate narrative drafts
- Identify key points
- Create visualizations
- Suggest analogies

### Best Practices
- Lead with the conclusion
- Use concrete examples
- Quantify impact
- Tailor to audience
- Include limitations

### Exercise
Take a recent analysis and use AI to:
1. Generate a summary
2. Suggest visualizations
3. Draft recommendations
""",
                duration=40,
                completed=False
            )
        ],
        progress=0
    )
}

# Change management templates
TEMPLATES: dict[str, ChangeTemplate] = {
    "comm-1": ChangeTemplate(
        id="comm-1",
        title="AI Initiative Announcement",
        category=TemplateCategory.communication,
        content="""
# AI Initiative Announcement Template

## Subject Line
[Company] Launches [Initiative Name] - Transforming [Area] with AI

## Email Body

Dear [Team/Organization],

I'm excited to announce [Initiative Name], our new AI-powered initiative that will [brief description of purpose].

### What This Means for You
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Timeline
- **Phase 1** (Month): [Description]
- **Phase 2** (Month): [Description]
- **Phase 3** (Month): [Description]

### How to Get Involved
[Details on participation, training, feedback channels]

### Questions?
Contact [Name] at [email] or attend our Q&A session on [Date].

Best regards,
[Executive Sponsor]

---
**Note**: Customize tone and detail level based on audience.
"""
    ),
    "comm-2": ChangeTemplate(
        id="comm-2",
        title="AI Project Status Update",
        category=TemplateCategory.communication,
        content="""
# AI Project Status Update Template

## Project: [Name]
## Date: [Date]
## Status: 🟢 On Track / 🟡 At Risk / 🔴 Blocked

### Executive Summary
[2-3 sentences on overall status and key highlights]

### Progress This Period
- ✅ [Completed item 1]
- ✅ [Completed item 2]
- 🔄 [In progress item]

### Key Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| [Metric 1] | [X] | [Y] | [🟢/🟡/🔴] |
| [Metric 2] | [X] | [Y] | [🟢/🟡/🔴] |

### Risks & Issues
| Risk/Issue | Impact | Mitigation | Owner |
|------------|--------|------------|-------|
| [Description] | [H/M/L] | [Action] | [Name] |

### Next Period Goals
- [ ] [Goal 1]
- [ ] [Goal 2]

### Support Needed
[List any decisions or resources needed]
"""
    ),
    "stake-1": ChangeTemplate(
        id="stake-1",
        title="Stakeholder Analysis Matrix",
        category=TemplateCategory.stakeholder,
        content="""
# Stakeholder Analysis Matrix

## Project: [Name]

### Stakeholder Map

| Stakeholder | Role | Interest Level | Influence | Support | Strategy |
|-------------|------|----------------|-----------|---------|----------|
| [Name] | [Title] | High/Med/Low | High/Med/Low | Champion/Supporter/Neutral/Resistant | [Approach] |

### Power-Interest Grid

```
HIGH INFLUENCE
     |
     |  KEEP SATISFIED  |  MANAGE CLOSELY
     |    [Names]       |    [Names]
     |__________________|__________________
     |                  |
     |  MONITOR         |  KEEP INFORMED
     |    [Names]       |    [Names]
     |
LOW ---------------------------------------- HIGH INTEREST
```

### Engagement Plan

#### Champions (High Interest, High Influence)
- [Name]: [Engagement approach]

#### Keep Informed (High Interest, Low Influence)
- [Name]: [Communication approach]

#### Keep Satisfied (Low Interest, High Influence)
- [Name]: [Check-in approach]

### Key Concerns by Stakeholder
| Stakeholder | Top Concerns | How We'll Address |
|-------------|--------------|-------------------|
| [Name] | [Concern 1, 2] | [Mitigation] |
"""
    ),
    "stake-2": ChangeTemplate(
        id="stake-2",
        title="Executive Briefing Template",
        category=TemplateCategory.stakeholder,
        content="""
# Executive Briefing: [Topic]

## Date: [Date]
## Prepared by: [Name]
## Audience: [Executive Names]

---

### TL;DR (30 seconds)
[One paragraph summary: situation, key point, recommendation]

### Context (2 minutes)
**Situation**: [What's happening]
**Challenge**: [What we need to address]
**Opportunity**: [What we can achieve]

### Recommendation (2 minutes)
**Proposed approach**: [Brief description]

**Key benefits**:
1. [Benefit + quantification]
2. [Benefit + quantification]
3. [Benefit + quantification]

**Investment required**: [Time, money, resources]

### Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | L/M/H | L/M/H | [Plan] |

### Decision Required
[ ] Option A: [Description]
[ ] Option B: [Description]
[ ] Option C: [Description]

### Appendix
[Supporting data, detailed analysis, references]
"""
    ),
    "adopt-1": ChangeTemplate(
        id="adopt-1",
        title="AI Adoption Readiness Checklist",
        category=TemplateCategory.adoption,
        content="""
# AI Adoption Readiness Checklist

## Project: [Name]
## Team/Department: [Name]
## Assessment Date: [Date]

### Technical Readiness
- [ ] Data sources identified and accessible
- [ ] Data quality assessed and acceptable
- [ ] Technical infrastructure in place
- [ ] Integration points documented
- [ ] Security requirements defined
- [ ] Performance requirements specified

### Organizational Readiness
- [ ] Executive sponsor identified
- [ ] Project team assembled
- [ ] Roles and responsibilities defined
- [ ] Budget allocated
- [ ] Success metrics defined
- [ ] Timeline agreed upon

### Process Readiness
- [ ] Current process documented
- [ ] Pain points identified
- [ ] Future state defined
- [ ] Change impacts assessed
- [ ] Training needs identified
- [ ] Support model planned

### People Readiness
- [ ] Stakeholder analysis complete
- [ ] Communication plan in place
- [ ] Training program designed
- [ ] Champions identified
- [ ] Feedback mechanisms established
- [ ] Resistance strategies planned

### Governance Readiness
- [ ] AI ethics guidelines reviewed
- [ ] Compliance requirements identified
- [ ] Risk assessment complete
- [ ] Monitoring plan defined
- [ ] Escalation process established
- [ ] Documentation standards set

### Overall Score
- Technical: [X/6]
- Organizational: [X/6]
- Process: [X/6]
- People: [X/6]
- Governance: [X/6]
- **Total: [X/30]**

### Go/No-Go Recommendation
[ ] Ready to proceed
[ ] Proceed with conditions: [List]
[ ] Not ready - address: [Gaps]
"""
    ),
    "adopt-2": ChangeTemplate(
        id="adopt-2",
        title="Training Program Outline",
        category=TemplateCategory.adoption,
        content="""
# AI Training Program Outline

## Program: [Name]
## Target Audience: [Roles]
## Duration: [X weeks/hours]

---

### Program Objectives
By the end of this program, participants will be able to:
1. [Objective 1]
2. [Objective 2]
3. [Objective 3]

### Curriculum Overview

#### Module 1: [Title] (X hours)
**Topics**:
- [Topic 1]
- [Topic 2]

**Activities**:
- [Activity type]: [Description]

**Assessment**: [Method]

#### Module 2: [Title] (X hours)
**Topics**:
- [Topic 1]
- [Topic 2]

**Activities**:
- [Activity type]: [Description]

**Assessment**: [Method]

### Delivery Methods
- [ ] Self-paced online
- [ ] Instructor-led virtual
- [ ] Instructor-led in-person
- [ ] Hands-on workshops
- [ ] Mentoring/coaching

### Schedule
| Module | Dates | Format | Instructor |
|--------|-------|--------|------------|
| 1 | [Date] | [Format] | [Name] |
| 2 | [Date] | [Format] | [Name] |

### Resources Needed
- [Resource 1]
- [Resource 2]

### Success Metrics
- Completion rate: [Target]
- Assessment scores: [Target]
- Participant satisfaction: [Target]
- On-the-job application: [Target]

### Post-Training Support
- [Support mechanism 1]
- [Support mechanism 2]
"""
    )
}


@router.get("/paths", response_model=List[LearningPath])
async def get_learning_paths(role: Optional[LearningRole] = None):
    """Get all learning paths with optional role filter"""
    paths = list(LEARNING_PATHS.values())
    
    if role:
        paths = [p for p in paths if p.role == role]
    
    return paths


@router.get("/paths/{path_id}", response_model=LearningPath)
async def get_learning_path(path_id: str):
    """Get a specific learning path"""
    if path_id not in LEARNING_PATHS:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return LEARNING_PATHS[path_id]


@router.get("/paths/{path_id}/modules", response_model=List[LearningModule])
async def get_path_modules(path_id: str):
    """Get modules for a learning path"""
    if path_id not in LEARNING_PATHS:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return LEARNING_PATHS[path_id].modules


@router.get("/modules/{module_id}", response_model=LearningModule)
async def get_module(module_id: str):
    """Get a specific module"""
    for path in LEARNING_PATHS.values():
        for module in path.modules:
            if module.id == module_id:
                return module
    raise HTTPException(status_code=404, detail="Module not found")


@router.post("/modules/{module_id}/complete")
async def complete_module(module_id: str, user_id: str = "default", db: Session = Depends(get_db)):
    """Mark a module as completed"""
    repo = LearningRepository(db)
    
    # Find module in static data to validate it exists
    path_id = None
    for path in LEARNING_PATHS.values():
        for module in path.modules:
            if module.id == module_id:
                path_id = path.id
                break
        if path_id:
            break
    
    if not path_id:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # Record completion in database
    repo.complete_module(user_id, module_id, path_id)
    
    return {
        "message": "Module marked as complete",
        "module_id": module_id,
        "path_id": path_id
    }


@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str, db: Session = Depends(get_db)):
    """Get learning progress for a user"""
    repo = LearningRepository(db)
    progress_records = repo.get_user_progress(user_id)
    
    completed = [p.module_id for p in progress_records]
    
    # Calculate progress per path
    path_progress = {}
    for path_id, path in LEARNING_PATHS.items():
        total = len(path.modules)
        done = sum(1 for m in path.modules if m.id in completed)
        path_progress[path_id] = {
            "completed": done,
            "total": total,
            "percentage": int(done / total * 100) if total > 0 else 0
        }
    
    return {
        "user_id": user_id,
        "completed_modules": completed,
        "total_completed": len(completed),
        "path_progress": path_progress
    }


# Change Templates endpoints
@router.get("/templates", response_model=List[ChangeTemplate])
async def get_templates(category: Optional[TemplateCategory] = None):
    """Get all change management templates"""
    templates = list(TEMPLATES.values())
    
    if category:
        templates = [t for t in templates if t.category == category]
    
    return templates


@router.get("/templates/categories")
async def get_template_categories():
    """Get all template categories"""
    return [
        {"value": cat.value, "label": cat.value.replace("-", " ").title()}
        for cat in TemplateCategory
    ]


@router.get("/templates/{template_id}", response_model=ChangeTemplate)
async def get_template(template_id: str):
    """Get a specific template"""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    return TEMPLATES[template_id]


@router.get("/roles")
async def get_roles():
    """Get all learning roles"""
    return [
        {"value": role.value, "label": role.value.title(), "description": desc}
        for role, desc in [
            (LearningRole.executive, "C-suite and senior leadership"),
            (LearningRole.manager, "Project and team managers"),
            (LearningRole.engineer, "Technical practitioners"),
            (LearningRole.analyst, "Business and data analysts")
        ]
    ]


@router.get("/stats")
async def get_learning_stats():
    """Get overall learning statistics"""
    total_paths = len(LEARNING_PATHS)
    total_modules = sum(len(p.modules) for p in LEARNING_PATHS.values())
    total_templates = len(TEMPLATES)
    
    # Calculate total duration
    total_duration = sum(
        sum(m.duration for m in p.modules)
        for p in LEARNING_PATHS.values()
    )
    
    return {
        "total_paths": total_paths,
        "total_modules": total_modules,
        "total_templates": total_templates,
        "total_duration_minutes": total_duration,
        "paths_by_role": {
            role.value: len([p for p in LEARNING_PATHS.values() if p.role == role])
            for role in LearningRole
        },
        "templates_by_category": {
            cat.value: len([t for t in TEMPLATES.values() if t.category == cat])
            for cat in TemplateCategory
        }
    }
