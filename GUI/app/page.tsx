"use client"

import { MessagingInterface } from "@/components/messaging-interface"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const { isAuthenticated, login } = useAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12">
      {!isAuthenticated ? (
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onAuthSuccess={login}
        />
      ) : (
        <MessagingInterface />
      )}
    </main>
  )
}