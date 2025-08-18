"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CircleUserRound, LogOut } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { useSession, signOut } from "next-auth/react"
import { Badge } from "~/components/ui/badge"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const isLanding = pathname === "/"

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={"/"}
          className="font-semibold"
        >
          CoDE Camp
        </Link>

        {isLanding ? (
          <div />
        ) : session?.user ? (
          <div className="flex items-center gap-3">
              <Badge
                variant={session.user.role === "admin" ? "secondary" : "outline"}
                className="hover:cursor-pointer"
              >
                {session.user.role === "admin" ? "Admin" : "Competitor"}
              </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:cursor-pointer">
                  <CircleUserRound className="h-5 w-5" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session.user.name ?? session.user.email ?? "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/problems")} className="hover:cursor-pointer">Problems</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 hover:cursor-pointer"
                  onClick={async () => {
                    await signOut({ redirect: false })
                    router.push("/")
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div />
        )}
      </div>
    </header>
  )
}
