"use client"

import { Fragment, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import type { CodeDialogState } from "~/types/code-dialog-state.types"
import { api, type RouterOutputs } from "~/trpc/react"

type SubmissionItem = RouterOutputs["admin"]["listSubmissions"][number]

export function AdminSubmissions() {
  const { status } = useSession()
  const submissionsQuery = api.admin.listSubmissions.useQuery(undefined, { enabled: status === "authenticated" })
  const submissions = submissionsQuery.data
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null)
  const [codeDialog, setCodeDialog] = useState<CodeDialogState>({ open: false })

  const grouped = useMemo(() => {
    if (!submissions) return [] as Array<{
      pid: string
      problemTitle: string
      total: number
      languages: Array<{ lang: string; count: number }>
      users: Array<{
        userId: string
        name: string
        email: string
        totalSubmissions: number
        latest: SubmissionItem | undefined
      }>
    }>

    // Build group: problem -> languages breakdown, total, users who submitted
    const map = new Map<
      string,
      {
        pid: string
        problemTitle: string
        total: number
        byLang: Map<string, number>
        byUser: Map<
          string,
          {
            userId: string
            submissions: Array<SubmissionItem>
          }
        >
      }
    >()

    for (const s of submissions) {
      const pid = s.problemId
      const ptitle = s.problem?.title ?? "(Untitled)"
      if (!map.has(pid)) {
        map.set(pid, {
          pid,
          problemTitle: ptitle,
          total: 0,
          byLang: new Map(),
          byUser: new Map(),
        })
      }
      const entry = map.get(pid)!
      entry.total += 1
      entry.byLang.set(s.language, (entry.byLang.get(s.language) ?? 0) + 1)

      if (!entry.byUser.has(s.userId)) {
        entry.byUser.set(s.userId, { userId: s.userId, submissions: [] as Array<SubmissionItem> })
      }
      entry.byUser.get(s.userId)!.submissions.push(s)
    }

    // Convert to array sorted by total desc
    return Array.from(map.values())
      .map((v) => ({
        pid: v.pid,
        problemTitle: v.problemTitle,
        total: v.total,
        languages: Array.from(v.byLang.entries()).map(([lang, count]) => ({ lang, count })),
        users: Array.from(v.byUser.values()).map((u) => {
          // latest submission by createdAt
          const sorted = [...u.submissions].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          const latest = sorted[0]
          const userMeta = latest?.user
          return {
            userId: u.userId,
            name: userMeta?.name ?? "Unknown",
            email: userMeta?.email ?? "",
            totalSubmissions: u.submissions.length,
            latest,
          }
        }),
      }))
      .sort((a, b) => b.total - a.total)
  }, [submissions])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Submissions (grouped by problem and language)</CardTitle>
        </CardHeader>
        <CardContent>
              {submissionsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading submissions…</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Breakdown</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((g) => {
                  const expanded = expandedProblemId === g.pid
                  return (
                    <Fragment key={g.pid}>
                      <TableRow
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        onClick={() => setExpandedProblemId(expanded ? null : g.pid)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-medium">{g.problemTitle}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {g.languages.map((l) => (
                              <Badge key={l.lang} variant="outline">
                                {l.lang}: {l.count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{g.total}</TableCell>
                      </TableRow>

                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={3} className="bg-muted/30 p-0">
                            <div className="p-3">
                              {g.users.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No users yet.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Latest</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {g.users.map((u) => (
                                        <TableRow key={u.userId}>
                                          <TableCell className="font-medium">{u.name}</TableCell>
                                          <TableCell className="text-xs sm:text-sm break-all">{u.email}</TableCell>
                                          <TableCell className="text-xs">{u.latest?.language ?? "-"}</TableCell>
                                          <TableCell className="text-right">{u.totalSubmissions}</TableCell>
                                          <TableCell className="text-right">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setCodeDialog({
                                                  open: true,
                                                  problemTitle: g.problemTitle,
                                                  userName: u.name,
                                                  language: u.latest?.language,
                                                  code: u.latest?.code,
                                                })
                                              }}
                                              className="hover:cursor-pointer"
                                            >
                                              View code
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={codeDialog.open} onOpenChange={(o) => setCodeDialog((prev) => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-[90vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {codeDialog.userName ? `${codeDialog.userName}'s latest submission` : "Submission code"}
            </DialogTitle>
            <DialogDescription>
              {codeDialog.problemTitle ? `Problem: ${codeDialog.problemTitle}` : null}
              {codeDialog.language ? ` • Language: ${codeDialog.language}` : null}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3">
            <pre className="whitespace-pre text-xs leading-relaxed">
              <code>{codeDialog.code ?? "// No code found."}</code>
            </pre>
          </div>
          <DialogFooter className="flex justify-between">
            <div />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!codeDialog.code) return
                  navigator.clipboard.writeText(codeDialog.code).catch(() => {})
                }}
              >
                Copy code
              </Button>
              <Button onClick={() => setCodeDialog({ open: false })}>Close</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function useData(): { submissions: any[]; problems: any[]; users: any[] } {
  // Temporary in-memory demo data for the admin UI
  const problems = [
    { id: "p1", title: "Two Sum" },
    { id: "p2", title: "Valid Parentheses" },
  ]
  const users = [
    { id: "1", name: "Alice Example", email: "alice@example.com" },
    { id: "2", name: "Bob Example", email: "bob@example.com" },
  ]
  const now = Date.now()
  const submissions = [
    {
      problemId: "p1",
      userId: "1",
      language: "TypeScript",
      code: "function twoSum(nums:number[],target:number){return []}",
      createdAt: now - 1000 * 60 * 5,
    },
    {
      problemId: "p1",
      userId: "2",
      language: "Python",
      code: "def two_sum(nums, target):\n    return []",
      createdAt: now - 1000 * 60 * 2,
    },
    {
      problemId: "p2",
      userId: "1",
      language: "Go",
      code: "package main\nfunc main() {}",
      createdAt: now - 1000 * 60 * 1,
    },
  ]

  return { submissions, problems, users }
}
