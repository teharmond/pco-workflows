export interface PCOPerson {
  type: string
  id: string
  attributes: {
    first_name: string
    last_name: string
    avatar?: string
  }
}

export interface PCOWorkflow {
  type: string
  id: string
  attributes: {
    name: string
    my_ready_card_count?: number
    total_ready_card_count?: number
    completed_card_count?: number
    total_cards_count?: number
    overdue_card_count?: number
    created_at: string
    updated_at: string
  }
}

export interface PCOWorkflowStep {
  type: string
  id: string
  attributes: {
    sequence: number
    name: string
    description?: string
    created_at: string
    updated_at: string
  }
}

export interface PCOWorkflowCard {
  type: string
  id: string
  attributes: {
    snooze_until?: string
    overdue: boolean
    stage: string
    sticky_assignment: boolean
    created_at: string
    updated_at: string
    completed_at?: string
    removed_at?: string
    moved_to_step_at?: string
  }
  relationships?: {
    assignee?: { data?: { type: string; id: string } }
    person?: { data?: { type: string; id: string } }
    workflow?: { data?: { type: string; id: string } }
    current_step?: { data?: { type: string; id: string } }
  }
  person?: PCOPerson | null
  assignee?: PCOPerson | null
  currentStepId?: string
}

export interface WorkflowDetailData {
  workflow: PCOWorkflow
  steps: PCOWorkflowStep[]
  cards: PCOWorkflowCard[]
}
