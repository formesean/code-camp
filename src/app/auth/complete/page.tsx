"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function AuthCompletePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user) {
      router.replace("/")
      return
    }
    if (session.user.role === "admin") {
      router.replace("/admin")
    } else {
      router.replace("/problems")
    }
  }, [status, session?.user, router])

  return null
}
