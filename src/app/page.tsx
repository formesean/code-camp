"use client"

import { useRouter } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Header } from "./_components/header"
import { signIn, signOut, useSession } from "next-auth/react"

export default function LandingPage() {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Practice coding. Minimal distractions.</h1>
        <p className="max-w-2xl text-balance text-muted-foreground">
          A simple, minimalist LeetCode-style interface. Sign up and start solving problems in seconds.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={async () => {
              // If a session exists (e.g., currently logged in as admin), sign out first
              if (session?.user) {
                await signOut({ redirect: false })
              }
              await signIn("google", {
                callbackUrl: "/auth/complete",
                prompt: "select_account",
              })
            }}
            className="hover:cursor-pointer"
          >
            Sign up
          </Button>
        </div>
      </main>
    </div>
  )
}
