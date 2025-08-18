"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Header } from "../_components/header"
import { GenerateProblemDialog } from "./_components/generate-problem-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "~/components/ui/table"
import { api } from "~/trpc/react"
import { AdminSubmissions } from "./_components/admin-submissions"
import { BreadboardingSubmissions } from "./_components/breadboarding-submissions"

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const usersQuery = api.admin.getUsers.useQuery(undefined, { enabled: status === "authenticated" })

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/")
    }
  }, [session?.user, status, router])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <GenerateProblemDialog />
        </div>
        <Tabs defaultValue="competitors">
          <TabsList>
            <TabsTrigger value="competitors" className="hover:cursor-pointer">Users</TabsTrigger>
            <TabsTrigger value="submissions" className="hover:cursor-pointer">Submissions</TabsTrigger>
          </TabsList>
          <TabsContent value="competitors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                {usersQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users</p>
                ) : !usersQuery.data || usersQuery.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{"No users yet."}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersQuery.data.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name ?? "-"}</TableCell>
                          <TableCell>{u.email ?? "-"}</TableCell>
                          <TableCell className="capitalize">{u.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="submissions" className="mt-4">
            <AdminSubmissions />
            <div className="h-4" />
            <BreadboardingSubmissions />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
