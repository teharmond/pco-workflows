"use client";

import type { PCOWorkflowStep, PCOWorkflowCard } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, UserCheck, ChevronRight } from "lucide-react";

interface ListViewProps {
  steps: PCOWorkflowStep[];
  cards: PCOWorkflowCard[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onCardClick: (card: PCOWorkflowCard) => void;
}

export function ListView({
  steps,
  cards,
  selectedStepId,
  onSelectStep,
  onCardClick,
}: ListViewProps) {
  const getCardsByStep = (stepId: string) => {
    return cards.filter((card) => card.currentStepId === stepId);
  };

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const selectedCards = selectedStepId ? getCardsByStep(selectedStepId) : [];

  return (
    <div className="flex gap-4 h-[calc(100vh-50px)] p-4">
      {/* Steps sidebar */}
      <div className="w-[280px] shrink-0 border  overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="font-medium text-sm">Steps</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {steps.map((step, index) => {
            const stepCards = getCardsByStep(step.id);
            const isSelected = selectedStepId === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b last:border-b-0 flex items-center justify-between hover:bg-muted/50 transition-colors",
                  isSelected && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {index + 1}) {step.attributes.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium">
                    {stepCards.length}
                  </span>
                  {isSelected && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 border  overflow-hidden flex flex-col">
        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
          <h3 className="font-medium text-sm">
            {selectedStep ? selectedStep.attributes.name : "Select a step"}
          </h3>
          {selectedStep && (
            <span className="text-xs text-muted-foreground">
              {selectedCards.length} card{selectedCards.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedStepId ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a step from the left to view cards
            </div>
          ) : selectedCards.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No cards in this step
            </div>
          ) : (
            <div className="space-y-3">
              {selectedCards.map((card) => {
                const personName = card.person
                  ? `${card.person.attributes.first_name} ${card.person.attributes.last_name}`
                  : "Unknown";
                const assigneeName = card.assignee
                  ? `${card.assignee.attributes.first_name} ${card.assignee.attributes.last_name}`
                  : "Unassigned";

                return (
                  <Card
                    key={card.id}
                    size="sm"
                    onClick={() => onCardClick(card)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <CardHeader className="border-b-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">
                            {personName}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {card.attributes.stage}
                          </CardDescription>
                        </div>
                        {card.attributes.overdue && (
                          <Badge variant="destructive" className="shrink-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span className="truncate">Person: {personName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3" />
                          <span className="truncate">
                            Assignee: {assigneeName}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
