"use client"

import { useRouter } from "next/navigation"
import { Header } from "../_components/header"
import { ProblemCard } from "./_components/problem-card"
import { api } from "~/trpc/react"

export default function ProblemsPage() {
  const router = useRouter()
  const problemsQuery = api.problem.list.useQuery()

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Problems</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problemsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading problems…</div>
          ) : problemsQuery.data && problemsQuery.data.length > 0 ? (
            problemsQuery.data.map((p: any) => (
              <ProblemCard
                key={p.id}
                problem={{
                  id: p.id,
                  title: p.title ?? "",
                  difficulty: (p.difficulty as any) ?? "Easy",
                  tags: p.tags ?? [],
                  description: p.description ?? "",
                  examples: (p as any).examples ?? [],
                }}
                onClick={() => router.push(`/problems/${p.id}`)}
              />
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No problems yet.</div>
          )}
        </div>
      </main>
    </div>
  )
}
