"use client"

import { Badge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { Problem } from "~/types/problem.types";

function difficultyColor(d: Problem["difficulty"]) {
  switch (d) {
    case "Easy":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    case "Medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
    case "Hard":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
  }
}

export function ProblemCard({ problem, onClick }: { problem: Problem; onClick?: () => void }) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="transition hover:shadow-sm focus:outline-none focus:ring-2"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{problem.title}</CardTitle>
        <span className={`rounded px-2 py-0.5 text-xs ${difficultyColor(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </CardHeader>
      <CardContent>
        <div className="line-clamp-2 text-sm text-muted-foreground">{problem.description}</div>
        <div className="mt-3 flex flex-wrap gap-1">
          {problem.tags.slice(0, 3).map((t) => (
            <Badge key={t} className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
