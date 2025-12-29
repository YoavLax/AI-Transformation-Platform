"""
AI Assistant repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import AIAssistantModel, AssistantStatus
from .base import BaseRepository


class AssistantRepository(BaseRepository[AIAssistantModel]):
    """Repository for AI assistant operations."""
    
    def __init__(self, db: Session):
        super().__init__(AIAssistantModel, db)
    
    def get_filtered(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[AIAssistantModel]:
        """Get assistants with optional filters."""
        query = self.db.query(self.model)
        
        if status:
            query = query.filter(self.model.status == status)
        
        if category:
            query = query.filter(self.model.category == category)
        
        return query.all()
    
    def get_active(self) -> List[AIAssistantModel]:
        """Get all active assistants."""
        return self.db.query(self.model).filter(
            self.model.status == AssistantStatus.active
        ).all()
    
    def get_by_vendor(self, vendor: str) -> List[AIAssistantModel]:
        """Get all assistants from a vendor."""
        return self.db.query(self.model).filter(
            self.model.vendor.ilike(f"%{vendor}%")
        ).all()
    
    def get_summary(self) -> dict:
        """Get summary statistics for AI assistants."""
        assistants = self.get_all()
        active_assistants = [a for a in assistants if a.status == AssistantStatus.active]
        
        # Calculate totals
        active_ai_tools = len(active_assistants)
        monthly_spend = sum(
            (a.monthly_price or 0) * (a.licenses or 0) 
            for a in active_assistants
        )
        total_licenses = sum(a.licenses or 0 for a in active_assistants)
        total_active_users = sum(a.active_users or 0 for a in active_assistants)
        utilization_rate = (total_active_users / total_licenses * 100) if total_licenses > 0 else 0
        
        # Group by category
        by_category = {}
        for a in assistants:
            cat = a.category or "other"
            if cat not in by_category:
                by_category[cat] = {"count": 0, "spend": 0}
            by_category[cat]["count"] += 1
            if a.status == AssistantStatus.active:
                by_category[cat]["spend"] += (a.monthly_price or 0) * (a.licenses or 0)
        
        # Group by status
        by_status = {}
        for a in assistants:
            status = a.status.value if a.status else "pending"
            by_status[status] = by_status.get(status, 0) + 1
        
        return {
            "active_ai_tools": active_ai_tools,
            "monthly_spend": monthly_spend,
            "total_licenses": total_licenses,
            "total_active_users": total_active_users,
            "utilization_rate": round(utilization_rate, 1),
            "by_category": by_category,
            "by_status": by_status
        }
    
    def bulk_upsert(self, assistants_data: List[dict]) -> int:
        """Bulk insert or update assistants (for sync from frontend)."""
        count = 0
        for data in assistants_data:
            existing = self.get(data.get("id"))
            if existing:
                # Update existing
                for key, value in data.items():
                    if key != "id" and hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                # Create new
                assistant = AIAssistantModel(**data)
                self.db.add(assistant)
            count += 1
        
        self.db.commit()
        return count
