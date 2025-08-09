"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "~/app/_components/header"
import { api } from "~/trpc/react"
import { ProblemView } from "../_components/problem-view"

export default function ProblemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params?.id ?? "")
  const problemQuery = api.problem.byId.useQuery({ id }, { enabled: id.length > 0 })

  // If you want to protect this route, add auth check here.

  if (!problemQuery.data && !problemQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm text-muted-foreground">{"Problem not found."}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-2 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4 md:h-[calc(100vh-140px)] md:overflow-auto">
            {problemQuery.isLoading || !problemQuery.data ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ProblemView problem={{
                id: problemQuery.data.id,
                title: problemQuery.data.title ?? "",
                difficulty: (problemQuery.data.difficulty as any) ?? "Easy",
                tags: problemQuery.data.tags ?? [],
                description: problemQuery.data.description ?? "",
                examples: (problemQuery.data as any).examples ?? [],
              }} />
            )}
          </div>
          <div className="rounded-md border md:h-[calc(100vh-140px)]">
            {/* <EditorPane
              onSubmit={(code, language) => {
                addSubmission({ userId: user.id, problemId: problem.id, language, code })
                toast({ title: "Submitted", description: "Your solution was submitted (demo)." })
              }}
            /> */}
          </div>
        </div>
      </main>
    </div>
  )
}
