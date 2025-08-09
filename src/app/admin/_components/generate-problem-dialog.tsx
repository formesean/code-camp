"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

type Difficulty = "Easy" | "Medium" | "Hard";

export function GenerateProblemDialog() {
  const [prompt, setPrompt] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [generated, setGenerated] = useState<{
    title: string;
    difficulty: Difficulty;
    tags: string[];
    description: string;
    examples: Array<{ input: string; output: string; explanation: string }>;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateMutation = api.admin.generateProblem.useMutation();
  // Clear generated preview and errors when prompt changes
  useEffect(() => {
    if (generated) {
      setGenerated(null);
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setIsAdding(false);
      setGenerated(null);
      setErrorMessage(null);
      setPrompt("");
      // reset mutation state if available
      if (typeof (generateMutation as any).reset === "function") {
        (generateMutation as any).reset();
      }
    }
  };

  const addProblemMutation = api.admin.createProblem.useMutation();
  const addProblem = async () => {
    if (!generated) return;
    await addProblemMutation.mutateAsync(generated);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 hover:cursor-pointer">
          <Sparkles className="h-4 w-4" />
          Generate with Gemini
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Problem</DialogTitle>
          <DialogDescription>
            Generate a coding problem using Gemini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium">Prompt</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the problem you want to generate..."
            disabled={isAdding}
          />
          <div className="rounded-md border p-3">
            {generated ? (
              <>
                <div className="text-sm font-medium">{generated.title}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Difficulty: {generated.difficulty}
                </div>
                <p className="mt-2 text-sm">{generated.description}</p>
                <div className="mt-2 text-xs">
                  Tags: {generated.tags.join(", ")}
                </div>
                {generated.examples?.length ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium">Example</div>
                    <pre className="bg-muted/40 overflow-auto rounded p-2 text-xs">
                      {`Input: ${generated.examples[0]?.input}
Output: ${generated.examples[0]?.output}
Explanation: ${generated.examples[0]?.explanation}`}
                    </pre>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No preview yet. Enter a prompt and click Generate.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          {errorMessage ? (
            <p className="text-destructive text-sm">{errorMessage}</p>
          ) : null}

          <Button
            onClick={async () => {
              setIsAdding(true);
              try {
                setErrorMessage(null);
                const promptText = prompt.trim();
                if (!generated) {
                  if (promptText.length === 0) {
                    setErrorMessage("Please enter a prompt.");
                    return;
                  }
                  const g = await generateMutation.mutateAsync({
                    prompt: promptText,
                  });
                  setGenerated(g);
                } else {
                  await addProblem();
                  setOpen(false);
                }
              } catch (err) {
                console.error(err);
                const message =
                  err instanceof Error
                    ? err.message
                    : "Failed to generate. Please try again.";
                setErrorMessage(message);
              } finally {
                setIsAdding(false);
              }
            }}
            disabled={isAdding || prompt.trim().length === 0}
            className="hover:cursor-pointer"
          >
            {isAdding
              ? generated
                ? "Adding..."
                : "Generating..."
              : generated
                ? "Confirm & Add"
                : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
