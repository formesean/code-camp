"use client"

import { Fragment, useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

type ImageDialogState = {
    open: boolean
    mode: "user" | "problem"
    problemTitle?: string
    userName?: string
    initialTab?: string
    tabs?: Array<{
        key: string
        label: string
        images: Array<{ src: string; userName?: string }>
    }>
}

export function BreadboardingSubmissions() {
    const { submissions, problems, users } = useBreadboardingData()
    const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null)
    const [imageDialog, setImageDialog] = useState<ImageDialogState>({ open: false, mode: "user" })

    const grouped = useMemo(() => {
        const map = new Map<
            string,
            {
                pid: string
                problemTitle: string
                total: number
                byType: Map<string, number>
                byUser: Map<
                    string,
                    {
                        userId: string
                        submissions: typeof submissions
                    }
                >
            }
        >()

        for (const s of submissions) {
            const p = problems.find((x: { id: string }) => x.id === s.problemId)
            if (!p) continue
            if (!map.has(p.id)) {
                map.set(p.id, {
                    pid: p.id,
                    problemTitle: p.title,
                    total: 0,
                    byType: new Map(),
                    byUser: new Map(),
                })
            }
            const entry = map.get(p.id)!
            entry.total += 1
            entry.byType.set(s.type, (entry.byType.get(s.type) ?? 0) + 1)

            if (!entry.byUser.has(s.userId)) {
                entry.byUser.set(s.userId, { userId: s.userId, submissions: [] as typeof submissions })
            }
            entry.byUser.get(s.userId)!.submissions.push(s)
        }

        return Array.from(map.values())
            .map((v) => ({
                pid: v.pid,
                problemTitle: v.problemTitle,
                total: v.total,
                users: Array.from(v.byUser.values()).map((u) => {
                    const sorted = [...u.submissions].sort((a, b) => b.createdAt - a.createdAt)
                    const latest = sorted[0]
                    const userMeta = users.find((uu: { id: string }) => uu.id === u.userId)

                    const artifactsPresence: Record<string, boolean> = {
                        "Truth Table": false,
                        "POS/SOP": false,
                        "K-Map": false,
                        "Diagram": false,
                    }
                    for (const sub of u.submissions) {
                        if (sub.type === "Truth Table") artifactsPresence["Truth Table"] = true
                        if (sub.type === "POS" || sub.type === "SOP" || sub.type === "POS/SOP") artifactsPresence["POS/SOP"] = true
                        if (sub.type === "K-Map") artifactsPresence["K-Map"] = true
                        if (sub.type === "Diagram") artifactsPresence["Diagram"] = true
                    }

                    const updatedAt = sorted[0]?.createdAt ?? 0

                    return {
                        userId: u.userId,
                        name: userMeta?.name ?? "Unknown",
                        email: userMeta?.email ?? "",
                        totalSubmissions: u.submissions.length,
                        latest,
                        artifactsPresence,
                        updatedAt,
                        allSubmissions: u.submissions,
                    }
                }),
            }))
            .sort((a, b) => b.total - a.total)
    }, [submissions, problems, users])

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Breadboarding</CardTitle>
                </CardHeader>
                <CardContent>
                    {grouped.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No submissions yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Problem</TableHead>
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
                                                    <TableCell className="text-right">{g.total}</TableCell>
                                                </TableRow>

                                                {expanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="bg-muted/30 p-0">
                                                            <div className="p-3">
                                                                <div className="mb-3 flex items-center justify-between">
                                                                    <p className="text-sm text-muted-foreground">Submissions by user</p>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="secondary"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            const labels = ["Truth Table", "POS/SOP", "Diagram", "K-Map"]
                                                                            const tabs = labels.map((label) => ({
                                                                                key: label.toLowerCase().replace(/\s+/g, "-"),
                                                                                label,
                                                                                images: g.users
                                                                                    .flatMap((user) =>
                                                                                        (user.allSubmissions as any[]).map((s) => ({ submission: s, userName: user.name }))
                                                                                    )
                                                                                    .filter(({ submission }) =>
                                                                                        label === "POS/SOP"
                                                                                            ? submission.type === "POS" || submission.type === "SOP" || submission.type === "POS/SOP"
                                                                                            : submission.type === label
                                                                                    )
                                                                                    .flatMap(({ submission, userName }) =>
                                                                                        (submission.images || []).map((src: string) => ({ src, userName }))
                                                                                    ),
                                                                            }))
                                                                            setImageDialog({
                                                                                open: true,
                                                                                mode: "problem",
                                                                                problemTitle: g.problemTitle,
                                                                                userName: undefined,
                                                                                tabs,
                                                                                initialTab: tabs[0]?.key,
                                                                            })
                                                                        }}
                                                                        className="hover:cursor-pointer"
                                                                    >
                                                                        View all images by category
                                                                    </Button>
                                                                </div>
                                                                {g.users.length === 0 ? (
                                                                    <p className="text-sm text-muted-foreground">No users yet.</p>
                                                                ) : (
                                                                    <div className="overflow-x-auto">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    <TableHead>User</TableHead>
                                                                                    <TableHead>Email</TableHead>
                                                                                    <TableHead>Artifacts</TableHead>
                                                                                    <TableHead>Last updated</TableHead>
                                                                                    <TableHead className="text-right">Total</TableHead>
                                                                                    <TableHead className="text-right">Action</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {g.users.map((u) => (
                                                                                    <TableRow key={u.userId}>
                                                                                        <TableCell className="font-medium">{u.name}</TableCell>
                                                                                        <TableCell className="text-xs sm:text-sm break-all">{u.email}</TableCell>
                                                                                        <TableCell>
                                                                                            <div className="flex items-center gap-2">
                                                                                                {(["Truth Table", "POS/SOP", "K-Map", "Diagram"] as const).map((label) => {
                                                                                                    const filled = (u as any).artifactsPresence?.[label]
                                                                                                    return (
                                                                                                        <span
                                                                                                            key={label}
                                                                                                            title={`${label}: ${filled ? "Submitted" : "Missing"}`}
                                                                                                            className={`inline-block h-3 w-3 rounded-full border ${filled ? "bg-emerald-500 border-emerald-600" : "bg-transparent border-muted-foreground/40"
                                                                                                                }`}
                                                                                                        />
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        </TableCell>
                                                                                        <TableCell className="text-xs text-muted-foreground">{(u as any).updatedAt ? new Date((u as any).updatedAt).toLocaleString() : "-"}</TableCell>
                                                                                        <TableCell className="text-right">{u.totalSubmissions}</TableCell>
                                                                                        <TableCell className="text-right">
                                                                                            <Button
                                                                                                size="sm"
                                                                                                variant="outline"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    const labels = ["Truth Table", "POS/SOP", "Diagram", "K-Map"]
                                                                                                    const tabs = labels.map((label) => ({
                                                                                                        key: label.toLowerCase().replace(/\s+/g, "-"),
                                                                                                        label,
                                                                                                        images: (u.allSubmissions as any[])
                                                                                                            .filter((s) =>
                                                                                                                label === "POS/SOP"
                                                                                                                    ? s.type === "POS" || s.type === "SOP" || s.type === "POS/SOP"
                                                                                                                    : s.type === label
                                                                                                            )
                                                                                                            .flatMap((s) => (s.images || []).map((src: string) => ({ src }))),
                                                                                                    }))
                                                                                                    setImageDialog({
                                                                                                        open: true,
                                                                                                        mode: "user",
                                                                                                        problemTitle: g.problemTitle,
                                                                                                        userName: u.name,
                                                                                                        tabs,
                                                                                                        initialTab: tabs[0]?.key,
                                                                                                    })
                                                                                                }}
                                                                                                className="hover:cursor-pointer"
                                                                                            >
                                                                                                View
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

            <Dialog open={imageDialog.open} onOpenChange={(o) => setImageDialog((prev) => ({ ...prev, open: o }))}>
                <DialogContent className="max-w-[90vw] sm:max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>
                            {imageDialog.mode === "problem"
                                ? imageDialog.problemTitle
                                    ? `All images • ${imageDialog.problemTitle}`
                                    : "All images"
                                : imageDialog.userName
                                    ? `${imageDialog.userName}'s submission`
                                    : "Submission images"}
                        </DialogTitle>
                        <DialogDescription>
                            {imageDialog.mode === "problem"
                                ? "Grouped by category across all users"
                                : imageDialog.problemTitle
                                    ? `Problem: ${imageDialog.problemTitle}`
                                    : null}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3">
                        {imageDialog.tabs && imageDialog.tabs.length > 0 ? (
                            <Tabs defaultValue={imageDialog.initialTab}>
                                <TabsList className="flex w-full flex-wrap gap-1">
                                    {imageDialog.tabs.map((t) => (
                                        <TabsTrigger key={t.key} value={t.key} className="hover:cursor-pointer">
                                            {t.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {imageDialog.tabs.map((t) => (
                                    <TabsContent key={t.key} value={t.key} className="mt-3">
                                        {t.images.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {t.images.map((img, idx) => (
                                                    <figure key={idx} className="overflow-hidden rounded-md border bg-background">
                                                        <img src={img.src} alt={`${t.label} ${idx + 1}`} className="block h-auto w-full" />
                                                        {imageDialog.mode === "problem" && img.userName ? (
                                                            <figcaption className="border-t p-2 text-xs text-muted-foreground">{img.userName}</figcaption>
                                                        ) : null}
                                                    </figure>
                                                ))}
                                            </div>
                                        ) : (
                                            <pre className="whitespace-pre text-xs leading-relaxed">
                                                <code>{"// No images in this category."}</code>
                                            </pre>
                                        )}
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : (
                            <pre className="whitespace-pre text-xs leading-relaxed">
                                <code>{"// No images found."}</code>
                            </pre>
                        )}
                    </div>
                    <DialogFooter className="flex justify-between">
                        <div />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const images = (imageDialog.tabs || []).flatMap((t) => t.images.map((i) => i.src))
                                    if (!images || images.length === 0) return
                                    const urls = images.join("\n")
                                    navigator.clipboard.writeText(urls).catch(() => { })
                                }}
                            >
                                Copy image URLs
                            </Button>
                            <Button onClick={() => setImageDialog((prev) => ({ ...prev, open: false }))}>Close</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function useBreadboardingData(): { submissions: any[]; problems: any[]; users: any[] } {
    // Temporary in-memory demo data for the breadboarding UI
    const problems = [
        { id: "p1", title: "3-Input Majority Voter" },
        { id: "p2", title: "4-Input Even Parity Detector" },
    ]
    const users = [
        { id: "1", name: "Alice Example", email: "alice@example.com" },
        { id: "2", name: "Bob Example", email: "bob@example.com" },
    ]

    // Simple inline SVG placeholders (encoded # as %23) to avoid external image deps
    const IMG_DIAGRAM =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640'><rect width='100%' height='100%' fill='%23f3f4f6'/><text x='50%' y='50%' font-size='24' fill='%23374151' text-anchor='middle' dominant-baseline='middle'>Diagram</text></svg>"
    const IMG_TRUTH_TABLE =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' font-size='24' fill='%23374151' text-anchor='middle' dominant-baseline='middle'>Truth Table</text></svg>"
    const IMG_POS =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640'><rect width='100%' height='100%' fill='%23ecfeff'/><text x='50%' y='50%' font-size='24' fill='%23374151' text-anchor='middle' dominant-baseline='middle'>POS</text></svg>"
    const IMG_SOP =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640'><rect width='100%' height='100%' fill='%23fef9c3'/><text x='50%' y='50%' font-size='24' fill='%23374151' text-anchor='middle' dominant-baseline='middle'>SOP</text></svg>"
    const IMG_KMAP =
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='640'><rect width='100%' height='100%' fill='%23fde68a'/><text x='50%' y='50%' font-size='24' fill='%23374151' text-anchor='middle' dominant-baseline='middle'>K-Map</text></svg>"

    const now = Date.now()
    const submissions = [
        {
            problemId: "p1",
            userId: "1",
            type: "Diagram",
            images: [IMG_DIAGRAM],
            createdAt: now - 1000 * 60 * 7,
        },
        {
            problemId: "p1",
            userId: "2",
            type: "Truth Table",
            images: [IMG_TRUTH_TABLE],
            createdAt: now - 1000 * 60 * 3,
        },
        {
            problemId: "p2",
            userId: "1",
            type: "POS",
            images: [IMG_POS, IMG_SOP],
            createdAt: now - 1000 * 60 * 1,
        },
    ]

    return { submissions, problems, users }
}


