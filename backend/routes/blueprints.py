from fastapi import APIRouter, HTTPException
from typing import List
import uuid

from models import Blueprint, BlueprintCategory, BlueprintComponent

router = APIRouter()

# Pre-populated blueprints (reference architectures)
BLUEPRINTS: dict[str, Blueprint] = {
    "rag-architecture": Blueprint(
        id="rag-architecture",
        name="RAG (Retrieval-Augmented Generation)",
        category=BlueprintCategory.rag,
        description="Production-ready architecture for building AI systems that combine retrieval with generation for accurate, grounded responses.",
        diagram="""
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RAG Orchestrator                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Query Analyzer│──│  Retriever   │──│ Response Generator   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│   Embeddings │    │Vector Store  │    │       LLM API        │
│   Service    │    │(Pinecone/    │    │(OpenAI/Azure/Local)  │
└──────────────┘    │Weaviate/Qdrant)    └──────────────────────┘
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Document Store│
                    │(S3/GCS/Azure)│
                    └──────────────┘
""",
        components=[
            BlueprintComponent(
                name="Query Analyzer",
                type="service",
                description="Analyzes and preprocesses user queries, handles query expansion and reformulation",
                technologies=["Python", "LangChain", "FastAPI"]
            ),
            BlueprintComponent(
                name="Embeddings Service",
                type="service",
                description="Generates vector embeddings for documents and queries",
                technologies=["OpenAI Embeddings", "Sentence Transformers", "HuggingFace"]
            ),
            BlueprintComponent(
                name="Vector Store",
                type="database",
                description="Stores and retrieves document embeddings for similarity search",
                technologies=["Pinecone", "Weaviate", "Qdrant", "Chroma"]
            ),
            BlueprintComponent(
                name="RAG Orchestrator",
                type="service",
                description="Coordinates the retrieval and generation pipeline",
                technologies=["LangChain", "LlamaIndex", "Python"]
            ),
            BlueprintComponent(
                name="LLM API",
                type="external",
                description="Large Language Model for response generation",
                technologies=["OpenAI GPT-4", "Azure OpenAI", "Anthropic Claude", "Local LLMs"]
            )
        ],
        best_practices=[
            "Implement chunking strategies that preserve context (512-1024 tokens)",
            "Use hybrid search combining dense vectors with keyword search",
            "Implement caching for frequently accessed embeddings",
            "Add citation/source tracking for generated responses",
            "Monitor retrieval quality with relevance metrics",
            "Implement guardrails for response validation"
        ],
        implementation_steps=[
            "Set up document ingestion pipeline with chunking",
            "Configure embedding model and vector store",
            "Implement retrieval service with reranking",
            "Set up LLM integration with prompt templates",
            "Build API layer with rate limiting and auth",
            "Add monitoring, logging, and evaluation metrics"
        ]
    ),
    "multi-agent": Blueprint(
        id="multi-agent",
        name="Multi-Agent AI System",
        category=BlueprintCategory.multi_agent,
        description="Architecture for building AI systems with multiple specialized agents that collaborate to solve complex tasks.",
        diagram="""
┌─────────────────────────────────────────────────────────────────┐
│                     Orchestrator Agent                          │
│  (Task decomposition, delegation, result aggregation)           │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Research Agent  │ │  Analysis Agent  │ │   Writer Agent   │
│  ──────────────  │ │  ──────────────  │ │  ──────────────  │
│  • Web search    │ │  • Data analysis │ │  • Content gen   │
│  • Doc retrieval │ │  • Code execution│ │  • Summarization │
│  • Fact checking │ │  • Visualization │ │  • Formatting    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Shared Memory / State                       │
│  (Conversation history, intermediate results, tool outputs)      │
└─────────────────────────────────────────────────────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Search Tools   │ │  Code Sandbox    │ │   Output Tools   │
│   API Access     │ │  Data Processing │ │   Export/Email   │
└──────────────────┘ └──────────────────┘ └──────────────────┘
""",
        components=[
            BlueprintComponent(
                name="Orchestrator Agent",
                type="agent",
                description="Central coordinator that breaks down tasks and delegates to specialized agents",
                technologies=["AutoGen", "CrewAI", "LangGraph"]
            ),
            BlueprintComponent(
                name="Specialized Agents",
                type="agent",
                description="Domain-specific agents with focused capabilities and tools",
                technologies=["LangChain Agents", "OpenAI Functions", "Custom Tools"]
            ),
            BlueprintComponent(
                name="Shared Memory",
                type="service",
                description="Centralized state management for agent collaboration",
                technologies=["Redis", "PostgreSQL", "In-memory store"]
            ),
            BlueprintComponent(
                name="Tool Registry",
                type="service",
                description="Collection of tools and APIs available to agents",
                technologies=["Function calling", "API integrations", "Code interpreters"]
            )
        ],
        best_practices=[
            "Define clear agent roles and responsibilities",
            "Implement robust error handling and fallbacks",
            "Use structured outputs for inter-agent communication",
            "Monitor agent interactions and token usage",
            "Implement timeout and circuit breaker patterns",
            "Add human-in-the-loop for critical decisions"
        ],
        implementation_steps=[
            "Define agent roles and capabilities",
            "Set up orchestration framework (AutoGen/CrewAI/LangGraph)",
            "Implement shared memory and state management",
            "Create and register agent tools",
            "Build inter-agent communication protocols",
            "Add monitoring, logging, and debugging capabilities"
        ]
    ),
    "mlops-pipeline": Blueprint(
        id="mlops-pipeline",
        name="MLOps Pipeline Architecture",
        category=BlueprintCategory.mlops,
        description="End-to-end machine learning operations pipeline for training, deploying, and monitoring models at scale.",
        diagram="""
┌────────────────────────────────────────────────────────────────────────┐
│                          Data Pipeline                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │Data Sources │──│ Ingestion   │──│ Validation  │──│Feature Store│   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Training Pipeline                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │Experiment   │──│ Training    │──│ Evaluation  │──│Model Registry│  │
│  │Tracking     │  │ Cluster     │  │ & Testing   │  └─────────────┘   │
│  └─────────────┘  └─────────────┘  └─────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Deployment Pipeline                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │CI/CD        │──│Containerize │──│ Deploy      │──│ A/B Testing │   │
│  │Pipeline     │  │& Package    │  │ (K8s/Cloud) │  │ & Rollout   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                                            │
                                                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Monitoring & Observability                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Metrics     │  │ Logging     │  │Model Drift  │  │ Alerting    │   │
│  │ Dashboard   │  │ & Tracing   │  │ Detection   │  │ & Oncall    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
""",
        components=[
            BlueprintComponent(
                name="Feature Store",
                type="service",
                description="Centralized repository for feature engineering and serving",
                technologies=["Feast", "Tecton", "AWS SageMaker Feature Store"]
            ),
            BlueprintComponent(
                name="Experiment Tracking",
                type="service",
                description="Track experiments, parameters, metrics, and artifacts",
                technologies=["MLflow", "Weights & Biases", "Neptune"]
            ),
            BlueprintComponent(
                name="Model Registry",
                type="service",
                description="Versioned storage for trained models with metadata",
                technologies=["MLflow", "AWS SageMaker", "Azure ML"]
            ),
            BlueprintComponent(
                name="Training Infrastructure",
                type="infrastructure",
                description="Scalable compute for model training",
                technologies=["Kubernetes", "Ray", "AWS SageMaker", "Azure ML"]
            ),
            BlueprintComponent(
                name="Serving Infrastructure",
                type="infrastructure",
                description="Model serving with auto-scaling and load balancing",
                technologies=["KServe", "Seldon", "TensorFlow Serving", "Triton"]
            ),
            BlueprintComponent(
                name="Monitoring",
                type="service",
                description="Model performance and drift monitoring",
                technologies=["Evidently", "WhyLabs", "Prometheus/Grafana"]
            )
        ],
        best_practices=[
            "Version everything: data, code, models, and configurations",
            "Implement automated testing at each pipeline stage",
            "Use feature stores for consistent feature engineering",
            "Set up model monitoring from day one",
            "Implement gradual rollout strategies (canary, blue-green)",
            "Maintain reproducibility with containerization"
        ],
        implementation_steps=[
            "Set up data pipeline with validation and feature store",
            "Configure experiment tracking and model registry",
            "Build training pipeline with hyperparameter tuning",
            "Create CI/CD pipeline for model deployment",
            "Deploy serving infrastructure with auto-scaling",
            "Implement monitoring, alerting, and feedback loops"
        ]
    ),
    "real-time-ai": Blueprint(
        id="real-time-ai",
        name="Real-Time AI Inference System",
        category=BlueprintCategory.real_time,
        description="Low-latency architecture for serving AI models in real-time applications with sub-100ms response times.",
        diagram="""
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
│     (Web, Mobile, IoT, Edge Devices)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CDN / Edge Network                             │
│              (Static content, edge caching)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway with Rate Limiting                      │
│         (Authentication, routing, request validation)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Load Balancer                                 │
│              (Round-robin, least connections)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Inference Pod 1  │ │ Inference Pod 2  │ │ Inference Pod N  │
│ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │ Model Server │ │ │ │ Model Server │ │ │ │ Model Server │ │
│ │ (GPU/TPU)    │ │ │ │ (GPU/TPU)    │ │ │ │ (GPU/TPU)    │ │
│ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │
└──────────────────┘ └──────────────────┘ └──────────────────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Redis Cache    │ │  Message Queue   │ │    Metrics       │
│   (Results)      │ │  (Async jobs)    │ │  (Prometheus)    │
└──────────────────┘ └──────────────────┘ └──────────────────┘
""",
        components=[
            BlueprintComponent(
                name="API Gateway",
                type="infrastructure",
                description="Entry point with authentication, rate limiting, and request routing",
                technologies=["Kong", "AWS API Gateway", "Azure API Management"]
            ),
            BlueprintComponent(
                name="Load Balancer",
                type="infrastructure",
                description="Distributes traffic across inference pods",
                technologies=["NGINX", "HAProxy", "Cloud Load Balancers"]
            ),
            BlueprintComponent(
                name="Inference Server",
                type="service",
                description="Optimized model serving with batching and GPU acceleration",
                technologies=["Triton", "TensorRT", "ONNX Runtime", "vLLM"]
            ),
            BlueprintComponent(
                name="Result Cache",
                type="service",
                description="Caches frequent predictions for reduced latency",
                technologies=["Redis", "Memcached"]
            ),
            BlueprintComponent(
                name="Auto-scaler",
                type="infrastructure",
                description="Scales inference pods based on demand",
                technologies=["Kubernetes HPA", "KEDA", "Cloud Auto-scaling"]
            )
        ],
        best_practices=[
            "Optimize models with quantization and pruning",
            "Implement request batching for throughput",
            "Use GPU memory pooling for efficient utilization",
            "Cache embeddings and frequent predictions",
            "Set up circuit breakers and graceful degradation",
            "Monitor latency percentiles (p50, p95, p99)"
        ],
        implementation_steps=[
            "Optimize model for inference (quantization, ONNX export)",
            "Set up inference server with GPU support",
            "Configure load balancing and auto-scaling",
            "Implement caching layer for frequent requests",
            "Add API gateway with rate limiting",
            "Set up comprehensive latency monitoring"
        ]
    ),
    "data-pipeline": Blueprint(
        id="data-pipeline",
        name="AI Data Pipeline",
        category=BlueprintCategory.data_pipeline,
        description="Scalable data pipeline architecture for ingesting, processing, and preparing data for AI/ML workloads.",
        diagram="""
┌────────────────────────────────────────────────────────────────────────┐
│                          Data Sources                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Databases │  │  APIs    │  │ Streams  │  │  Files   │  │   IoT    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Ingestion Layer                                  │
│  ┌────────────────────────┐    ┌────────────────────────┐              │
│  │    Batch Ingestion     │    │   Stream Ingestion     │              │
│  │   (Airbyte, Fivetran)  │    │   (Kafka, Kinesis)     │              │
│  └────────────────────────┘    └────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Data Lake (Raw Zone)                                │
│                  (S3, GCS, Azure Data Lake)                             │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Processing Layer                                    │
│  ┌────────────────────────┐    ┌────────────────────────┐              │
│  │   Batch Processing     │    │   Stream Processing    │              │
│  │  (Spark, Databricks)   │    │  (Flink, Spark SS)     │              │
│  └────────────────────────┘    └────────────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Data Lake (Curated Zone)                              │
│              ┌─────────────────────────────────┐                       │
│              │        Delta Lake / Iceberg      │                       │
│              │   (ACID, Time Travel, Schema)    │                       │
│              └─────────────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Serving Layer                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │Feature Store │  │Data Warehouse│  │  ML Training │                 │
│  │   (Feast)    │  │ (Snowflake)  │  │  (SageMaker) │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
""",
        components=[
            BlueprintComponent(
                name="Ingestion Layer",
                type="service",
                description="Connects to various data sources and ingests data reliably",
                technologies=["Airbyte", "Fivetran", "Kafka Connect", "AWS Glue"]
            ),
            BlueprintComponent(
                name="Data Lake",
                type="storage",
                description="Scalable storage for raw and processed data",
                technologies=["S3", "GCS", "Azure Data Lake", "Delta Lake"]
            ),
            BlueprintComponent(
                name="Processing Engine",
                type="service",
                description="Distributed processing for large-scale transformations",
                technologies=["Apache Spark", "Databricks", "Apache Flink"]
            ),
            BlueprintComponent(
                name="Orchestration",
                type="service",
                description="Workflow scheduling and dependency management",
                technologies=["Airflow", "Dagster", "Prefect"]
            ),
            BlueprintComponent(
                name="Data Quality",
                type="service",
                description="Automated data validation and quality monitoring",
                technologies=["Great Expectations", "dbt tests", "Monte Carlo"]
            ),
            BlueprintComponent(
                name="Data Catalog",
                type="service",
                description="Metadata management and data discovery",
                technologies=["DataHub", "Amundsen", "AWS Glue Catalog"]
            )
        ],
        best_practices=[
            "Implement data contracts between producers and consumers",
            "Use schema evolution and backward compatibility",
            "Add data quality checks at each pipeline stage",
            "Implement idempotent processing for reliability",
            "Maintain comprehensive data lineage",
            "Set up alerting for pipeline failures and data anomalies"
        ],
        implementation_steps=[
            "Set up data lake with raw and curated zones",
            "Configure ingestion connectors for data sources",
            "Implement processing pipelines with Spark/Flink",
            "Set up orchestration with Airflow/Dagster",
            "Add data quality validation and monitoring",
            "Configure feature store and serving layer"
        ]
    )
}


@router.get("/", response_model=List[Blueprint])
async def get_blueprints(category: BlueprintCategory = None):
    """Get all blueprints with optional category filter"""
    blueprints = list(BLUEPRINTS.values())
    
    if category:
        blueprints = [bp for bp in blueprints if bp.category == category]
    
    return blueprints


@router.get("/categories")
async def get_categories():
    """Get all available blueprint categories"""
    return [
        {"value": cat.value, "label": cat.value.replace("-", " ").title()}
        for cat in BlueprintCategory
    ]


@router.get("/{blueprint_id}", response_model=Blueprint)
async def get_blueprint(blueprint_id: str):
    """Get a specific blueprint by ID"""
    if blueprint_id not in BLUEPRINTS:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return BLUEPRINTS[blueprint_id]


@router.get("/{blueprint_id}/diagram")
async def get_blueprint_diagram(blueprint_id: str):
    """Get just the ASCII diagram for a blueprint"""
    if blueprint_id not in BLUEPRINTS:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return {"diagram": BLUEPRINTS[blueprint_id].diagram}


@router.get("/{blueprint_id}/components", response_model=List[BlueprintComponent])
async def get_blueprint_components(blueprint_id: str):
    """Get components for a specific blueprint"""
    if blueprint_id not in BLUEPRINTS:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    return BLUEPRINTS[blueprint_id].components


@router.get("/{blueprint_id}/steps")
async def get_implementation_steps(blueprint_id: str):
    """Get implementation steps for a blueprint"""
    if blueprint_id not in BLUEPRINTS:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    
    return {
        "blueprint_id": blueprint_id,
        "name": BLUEPRINTS[blueprint_id].name,
        "steps": BLUEPRINTS[blueprint_id].implementation_steps,
        "best_practices": BLUEPRINTS[blueprint_id].best_practices
    }
