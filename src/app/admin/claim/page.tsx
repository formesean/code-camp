"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "../../_components/header"
import { Button } from "~/components/ui/button"
import { api } from "~/trpc/react"
import { signIn, useSession } from "next-auth/react"

export default function ClaimAdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const utils = api.useUtils()
  const attemptedRef = useRef(false)

  const claim = api.admin.claimFirstAdmin.useMutation({
    onSuccess: async () => {
      await utils.invalidate()
      router.replace("/admin")
    },
  })

  useEffect(() => {
    if (status !== "authenticated") return
    if (attemptedRef.current) return
    attemptedRef.current = true
    claim.mutate()
  }, [status, claim])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Claim Admin</h1>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Sign in here to claim the first admin for this workspace. This works only once.
        </p>
        {status !== "authenticated" ? (
          <Button
            className="hover:cursor-pointer"
            onClick={() => signIn("google", { callbackUrl: "/admin/claim" })}
          >
            Sign in to claim admin
          </Button>
        ) : (
          <Button disabled className="hover:cursor-pointer">
            {claim.isPending ? "Claiming..." : "Claimed (or already claimed)"}
          </Button>
        )}
        {claim.isError && (
          <p className="text-sm text-destructive">{claim.error?.message ?? "Unable to claim admin"}</p>
        )}
      </main>
    </div>
  )
}
