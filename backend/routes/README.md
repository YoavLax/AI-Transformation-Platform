# API Routes

## Initiatives API

### Endpoints

#### GET `/api/initiatives`
Get all AI initiatives

**Response:** Array of AIInitiative objects

#### POST `/api/initiatives`
Create a new AI initiative

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "team": "string",
  "sponsor": "string",
  "status": "todo" | "in-progress" | "done",
  "start_date": "YYYY-MM-DD",
  "target_date": "YYYY-MM-DD",
  "ai_assistants": ["string"],
  "objectives": ["string"],
  "action_items": [
    {
      "id": "string",
      "title": "string",
      "completed": boolean,
      "assignee": "string",
      "due_date": "YYYY-MM-DD",
      "created_at": "ISO timestamp"
    }
  ],
  "risks": [
    {
      "id": "string",
      "category": "string",
      "description": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "mitigation": "string",
      "owner": "string",
      "status": "open" | "mitigated" | "accepted"
    }
  ],
  "progress": 0
}
```

#### GET `/api/initiatives/{initiative_id}`
Get a specific AI initiative

**Response:** AIInitiative object

#### PUT `/api/initiatives/{initiative_id}`
Update an AI initiative

**Request Body:** Partial AIInitiative object (only fields to update)

#### DELETE `/api/initiatives/{initiative_id}`
Delete an AI initiative

**Response:** Success message

#### POST `/api/initiatives/{initiative_id}/action-items`
Add an action item to an initiative

**Request Body:**
```json
{
  "id": "string",
  "title": "string",
  "completed": false,
  "assignee": "string (optional)",
  "due_date": "YYYY-MM-DD (optional)",
  "created_at": "ISO timestamp"
}
```

#### PUT `/api/initiatives/{initiative_id}/action-items/{action_item_id}`
Update an action item's completion status

**Query Parameters:**
- `completed`: boolean

#### DELETE `/api/initiatives/{initiative_id}/action-items/{action_item_id}`
Delete an action item from an initiative

**Response:** Updated AIInitiative object
