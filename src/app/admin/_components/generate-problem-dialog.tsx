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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";

import { api } from "~/trpc/react";
import type { Difficulty } from "~/types/difficulty.types";
import type { Problem } from "~/types/problem.types";

export function GenerateProblemDialog() {
  const [programmingPrompt, setProgrammingPrompt] = useState<string>("");
  const [breadboardingPrompt, setBreadboardingPrompt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"programming" | "breadboarding">("programming");
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  type GeneratedProblem = Omit<Problem, "id">;
  const [generated, setGenerated] = useState<GeneratedProblem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateMutation = api.admin.generateProblem.useMutation();

  useEffect(() => {
    if (generated) {
      setGenerated(null);
      setErrorMessage(null);
    }
  }, [programmingPrompt, breadboardingPrompt]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setIsAdding(false);
      setGenerated(null);
      setErrorMessage(null);
      setProgrammingPrompt("");
      setBreadboardingPrompt("");
      if (typeof generateMutation.reset === "function") {
        generateMutation.reset();
      }
    }
  };

  const addProblemMutation = api.admin.createProblem.useMutation();
  const addProblem = async () => {
    if (!generated) return;
    const payload = {
      ...generated,
      examples: generated.examples.map((ex) => ({
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation ?? "",
      })),
    };
    await addProblemMutation.mutateAsync(payload);
  };

  const currentPrompt = activeTab === "programming" ? programmingPrompt : breadboardingPrompt;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 hover:cursor-pointer">
          <Sparkles className="h-4 w-4" />
          Generate with Gemini
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(90vw,32rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Problem</DialogTitle>
          <DialogDescription>
            Choose a category and generate a problem using Gemini.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="programming" className="hover:cursor-pointer">Programming</TabsTrigger>
            <TabsTrigger value="breadboarding" className="hover:cursor-pointer">Breadboarding</TabsTrigger>
          </TabsList>

          <TabsContent value="programming">
            <PromptAndPreview
              prompt={programmingPrompt}
              setPrompt={setProgrammingPrompt}
              disabled={isAdding}
              generated={generated}
              placeholder="Describe the programming problem you want to generate..."
            />
          </TabsContent>

          <TabsContent value="breadboarding">
            <PromptAndPreview
              prompt={breadboardingPrompt}
              setPrompt={setBreadboardingPrompt}
              disabled={isAdding}
              generated={generated}
              placeholder="Describe the breadboarding problem you want to generate..."
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {errorMessage ? (
            <p className="text-destructive text-sm">{errorMessage}</p>
          ) : null}

          <Button
            onClick={async () => {
              setIsAdding(true);
              try {
                setErrorMessage(null);
                const promptText = currentPrompt.trim();
                if (!generated) {
                  if (promptText.length === 0) {
                    setErrorMessage("Please enter a prompt.");
                    return;
                  }
                  const categoryPrefix = activeTab === "breadboarding"
                    ? "Category: Breadboarding and electronics circuit design. Generate an electronics breadboarding problem.\n"
                    : "Category: Programming and algorithms. Generate a programming problem.\n";
                  const g = await generateMutation.mutateAsync({
                    prompt: `${categoryPrefix}${promptText}`,
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
            disabled={isAdding || currentPrompt.trim().length === 0}
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

function PromptAndPreview(props: {
  prompt: string;
  setPrompt: (value: string) => void;
  disabled: boolean;
  generated: Omit<Problem, "id"> | null;
  placeholder: string;
}) {
  const { prompt, setPrompt, disabled, generated, placeholder } = props;
  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <div className="rounded-md border p-3">
        {generated ? (
          <GeneratedPreview generated={generated} />
        ) : (
          <p className="text-muted-foreground text-sm">
            No preview yet. Enter a prompt and click Generate.
          </p>
        )}
      </div>
    </div>
  );
}

function GeneratedPreview(props: { generated: Omit<Problem, "id"> }) {
  const { generated } = props;
  const firstExample = generated.examples?.[0];
  const explanation = firstExample?.explanation;
  return (
    <>
      <div className="text-sm font-medium break-words">{generated.title}</div>
      <div className="text-muted-foreground mt-1 text-xs break-words">
        Difficulty: {generated.difficulty as Difficulty}
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap break-words">
        {generated.description}
      </p>
      <div className="mt-2 text-xs break-words">
        Tags: {generated.tags.join(", ")}
      </div>
      {firstExample ? (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium">Example</div>
          <pre className="bg-muted/40 rounded p-2 text-xs whitespace-pre-wrap break-words">{`Input: ${firstExample.input}
Output: ${firstExample.output}
${explanation ? `Explanation: ${explanation}` : ""}`}</pre>
        </div>
      ) : null}
    </>
  );
}
