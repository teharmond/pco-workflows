"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PCOPerson, PCOWorkflowStep } from "@/lib/types";
import { Check, Loader2, User } from "lucide-react";

interface AddToWorkflowModalProps {
  workflowId: string;
  workflowName?: string;
  steps: PCOWorkflowStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPersonAdded?: () => void;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

export function AddToWorkflowModal({
  workflowId,
  workflowName,
  steps,
  open,
  onOpenChange,
  onPersonAdded,
}: AddToWorkflowModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PCOPerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<PCOPerson | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<string>("0");
  const [adding, setAdding] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/people/search?q=${encodeURIComponent(searchQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.data || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedPerson(null);
      setSelectedStepIndex("0");
    }
  }, [open]);

  const handleSelectPerson = (person: PCOPerson) => {
    setSelectedPerson(person);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddToWorkflow = async () => {
    if (!selectedPerson) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: selectedPerson.id,
          targetStepIndex: parseInt(selectedStepIndex, 10),
        }),
      });

      if (response.ok) {
        onPersonAdded?.();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to add person:", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add someone to {workflowName || "workflow"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedPerson ? (
            <Command className="border " shouldFilter={false}>
              <CommandInput
                placeholder="Search by name..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {searching && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!searching &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 && (
                    <CommandEmpty>No people found.</CommandEmpty>
                  )}
                {!searching && searchQuery.length < 2 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                )}
                {searchResults.length > 0 && (
                  <CommandGroup heading="People">
                    {searchResults.map((person) => (
                      <CommandItem
                        key={person.id}
                        value={person.id}
                        onSelect={() => handleSelectPerson(person)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8  bg-muted flex items-center justify-center text-xs font-medium">
                            {getInitials(
                              person.attributes.first_name,
                              person.attributes.last_name
                            )}
                          </div>
                          <span>
                            {person.attributes.first_name}{" "}
                            {person.attributes.last_name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          ) : (
            <>
              {/* Selected person */}
              <div className="flex items-center gap-3 p-3 border  bg-muted/30">
                <div className="size-10  bg-muted flex items-center justify-center text-sm font-medium">
                  {getInitials(
                    selectedPerson.attributes.first_name,
                    selectedPerson.attributes.last_name
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {selectedPerson.attributes.first_name}{" "}
                    {selectedPerson.attributes.last_name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPerson(null)}
                >
                  Change
                </Button>
              </div>

              {/* Step selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Add to step</label>
                <Select
                  value={selectedStepIndex}
                  onValueChange={setSelectedStepIndex}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a step" />
                  </SelectTrigger>
                  <SelectContent>
                    {steps.map((step, index) => (
                      <SelectItem key={step.id} value={index.toString()}>
                        {index + 1}. {step.attributes.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Add button */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddToWorkflow} disabled={adding}>
                  {adding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Add to workflow
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
