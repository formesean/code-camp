"use client"

import { Badge } from "~/components/ui/badge"
import type { Problem } from "~/types/problem.types"

export function ProblemView({ problem }: { problem: Problem }) {
  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{problem.title}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs rounded bg-muted px-2 py-0.5">{problem.difficulty}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{problem.description}</p>
      <div className="flex flex-wrap gap-1">
        {problem.tags.map((t: string) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Examples</h2>
        {problem.examples.map((ex: { input: string; output: string; explanation?: string }, idx: number) => (
          <div key={idx} className="rounded-md border p-3">
            <div className="text-xs font-medium">Input</div>
            <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">{ex.input}</pre>
            <div className="mt-2 text-xs font-medium">Output</div>
            <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-xs">{ex.output}</pre>
            {ex.explanation && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">{"Explanation: "}</span>
                {ex.explanation}
              </p>
            )}
          </div>
        ))}
      </div>
    </article>
  )
}
