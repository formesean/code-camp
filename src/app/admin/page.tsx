"use client"
import { useRouter } from "next/navigation"
import { Header } from "../_components/header"
import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "admin") {
      router.replace("/")
    }
  }, [session?.user, status, router])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Practice coding. Minimal distractions.</h1>
        <p className="max-w-2xl text-balance text-muted-foreground">
          ADMIN PAGE
        </p>
      </main>
    </div>
  )
}
