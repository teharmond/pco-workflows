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
    total_orphaned_card_count?: number
    category_id?: string
    created_at: string
    updated_at: string
  }
}

export interface PCOWorkflowCategory {
  type: string
  id: string
  attributes: {
    name: string
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

export interface PCOWorkflowCardActivity {
  type: string
  id: string
  attributes: {
    comment?: string
    content?: string
    form_submission_url?: string
    automation_url?: string
    person_avatar_url?: string
    person_name?: string
    reassigned_to_avatar_url?: string
    reassigned_to_name?: string
    subject?: string
    type: string
    content_is_html: boolean
    created_at: string
  }
}

export interface PCOWorkflowCardNote {
  type: string
  id: string
  attributes: {
    note: string
    created_at: string
  }
}
