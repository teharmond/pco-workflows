"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TiptapEditor } from "@/components/tiptap-editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PCOWorkflowCard, PCOWorkflowCardActivity } from "@/lib/types";
import {
  Send,
  MessageSquare,
  Clock,
  Check,
  ChevronUp,
  SkipForward,
  FastForward,
  UserX,
  Trash2,
} from "lucide-react";

interface CardDetailModalProps {
  card: PCOWorkflowCard | null;
  workflowId: string;
  workflowName?: string;
  currentStepName?: string;
  nextStepName?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardUpdated?: () => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CardDetailModal({
  card,
  workflowId,
  workflowName,
  currentStepName,
  nextStepName,
  isFirstStep,
  isLastStep,
  open,
  onOpenChange,
  onCardUpdated,
}: CardDetailModalProps) {
  const [activities, setActivities] = useState<PCOWorkflowCardActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("note");
  const [completing, setCompleting] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const personId = card?.relationships?.person?.data?.id;
  const personName = card?.person
    ? `${card.person.attributes.first_name} ${card.person.attributes.last_name}`
    : "Unknown";
  const assigneeName = card?.assignee
    ? `${card.assignee.attributes.first_name} ${card.assignee.attributes.last_name}`
    : "Unassigned";

  useEffect(() => {
    if (open && card && personId) {
      setInitialLoadComplete(false);
      fetchActivities(true);
    }
  }, [open, card, personId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setInitialLoadComplete(false);
    }
  }, [open]);

  async function fetchActivities(isInitialLoad = false) {
    if (!card || !personId) return;

    // Only show loading skeleton on initial load
    if (isInitialLoad) {
      setLoadingActivities(true);
    }
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/activities?personId=${personId}`
      );
      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoadingActivities(false);
      setInitialLoadComplete(true);
    }
  }

  async function handleSaveNote() {
    if (!card || !personId || !note.trim()) return;

    setSavingNote(true);
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId, note: note.trim() }),
        }
      );

      if (response.ok) {
        setNote("");
        await fetchActivities();
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSendEmail() {
    if (!card || !personId || !emailSubject.trim() || !emailBody.trim()) return;

    setSendingEmail(true);
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId,
            subject: emailSubject.trim(),
            body: emailBody.trim(),
          }),
        }
      );

      if (response.ok) {
        setEmailSubject("");
        setEmailBody("");
        await fetchActivities();
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleCompleteStep() {
    if (!card || !personId) return;

    setCompleting(true);
    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/promote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        }
      );

      if (response.ok) {
        onCardUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to complete step:", error);
    } finally {
      setCompleting(false);
    }
  }

  async function handleGoBack() {
    if (!card || !personId) return;

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/go-back`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        }
      );

      if (response.ok) {
        onCardUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to go back:", error);
    }
  }

  async function handleSkipStep() {
    if (!card || !personId) return;

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/skip-step`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        }
      );

      if (response.ok) {
        onCardUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to skip step:", error);
    }
  }

  async function handleRemoveFromWorkflow() {
    if (!card || !personId) return;

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}/remove`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        }
      );

      if (response.ok) {
        onCardUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to remove from workflow:", error);
    } finally {
      setRemoveDialogOpen(false);
    }
  }

  async function handleDeleteCard() {
    if (!card || !personId) return;

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/cards/${card.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personId }),
        }
      );

      if (response.ok) {
        onCardUpdated?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    } finally {
      setDeleteDialogOpen(false);
    }
  }

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-muted-foreground font-normal">Workflow:</span>
            <span className="text-primary">{workflowName || "Workflow"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assignee info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10  bg-primary/10 flex items-center justify-center text-sm font-medium">
                {getInitials(assigneeName)}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned to:</p>
                <p className="font-medium">{assigneeName}</p>
              </div>
            </div>
            {card.attributes.overdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>

          {/* Person card */}
          <div className="border  p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12  bg-muted flex items-center justify-center text-lg font-medium">
                {getInitials(personName)}
              </div>
              <div>
                <p className="font-semibold">{personName}</p>
              </div>
            </div>

            <div className="border-t pt-3 mt-3 space-y-2">
              <p className="text-primary font-medium text-lg">
                {currentStepName || card.attributes.stage}
              </p>
              {nextStepName && !isLastStep && (
                <p className="text-sm text-muted-foreground">
                  <span className="italic">Next Step:</span> {nextStepName}
                </p>
              )}
              {isLastStep && (
                <p className="text-sm text-muted-foreground italic">
                  This is the final step
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    More options
                    <ChevronUp className="h-4 w-4 rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={handleGoBack}
                    disabled={isFirstStep}
                  >
                    <SkipForward className="h-4 w-4 mr-1 rotate-180" />
                    Go back a step
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSkipStep}
                    disabled={isLastStep}
                  >
                    <FastForward className="h-4 w-4 mr-1" />
                    Skip this step
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setRemoveDialogOpen(true)}
                    variant="destructive"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Remove from workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete card
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={handleCompleteStep}
                disabled={completing}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                {completing ? "Completing..." : "Complete step"}
              </Button>
            </div>
          </div>

          {/* Remove from workflow confirmation dialog */}
          <AlertDialog
            open={removeDialogOpen}
            onOpenChange={setRemoveDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from workflow?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove {personName} from this
                  workflow? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRemoveFromWorkflow}
                  variant="destructive"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete card confirmation dialog */}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete card?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete this card for{" "}
                  {personName}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCard}
                  variant="destructive"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="note" className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 " />
                Add note
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1.5">
                <Send className="h-4 w-4 " />
                Send email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="note" className="space-y-3">
              <Textarea
                placeholder="Write a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNote}
                  disabled={savingNote || !note.trim()}
                >
                  {savingNote ? "Saving..." : "Save note"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3">
              <Input
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
              <TiptapEditor
                content={emailBody}
                onChange={setEmailBody}
                placeholder="Write your email..."
              />

              <div className="flex justify-between items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  This email will be sent to the person on this card.
                </p>
                <Button
                  onClick={handleSendEmail}
                  disabled={
                    sendingEmail || !emailSubject.trim() || !emailBody.trim()
                  }
                >
                  {sendingEmail ? "Sending..." : "Send email"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Activity section - always visible below tabs */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Activity
            </h4>

            {loadingActivities && !initialLoadComplete ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="size-8  bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted  w-1/2 mb-2" />
                      <div className="h-3 bg-muted  w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No activity yet
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                      {activity.attributes.person_name
                        ? getInitials(activity.attributes.person_name)
                        : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.attributes.person_name || "System"}
                        </span>{" "}
                        {activity.attributes.comment ||
                          activity.attributes.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.attributes.created_at)}
                      </p>
                      {/* Show content for emails (with subject) and notes */}
                      {(activity.attributes.subject ||
                        activity.attributes.content) && (
                        <div className="mt-2 text-sm">
                          {activity.attributes.subject && (
                            <p className="font-medium border border-b-0 p-2 wrap-break-word">
                              {activity.attributes.subject}
                            </p>
                          )}
                          {activity.attributes.content &&
                            (activity.attributes.content_is_html ? (
                              <div
                                className="p-2 border text-muted-foreground prose prose-sm max-w-none wrap-break-word [&_a]:break-all"
                                dangerouslySetInnerHTML={{
                                  __html: activity.attributes.content,
                                }}
                              />
                            ) : (
                              <p className="p-2 bg-blue-500/10 text-muted-foreground whitespace-pre-wrap rounded-sm wrap-anywhere">
                                {activity.attributes.content}
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
