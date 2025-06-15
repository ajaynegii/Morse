"use client"

import { MessagingInterface } from "@/components/messaging-interface"
import { AuthModal } from "@/components/auth-modal"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect } from "react"

export default function Home() {
  const { isAuthenticated, login } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  useEffect(() => {
    // Open the auth modal if not authenticated
    console.log('isAuthenticated changed:', isAuthenticated);
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      console.log('Setting isAuthModalOpen to true');
    } else {
      setIsAuthModalOpen(false) // Close if authenticated (e.g., after successful login)
      console.log('Setting isAuthModalOpen to false');
    }
  }, [isAuthenticated])

  console.log('Current render - isAuthenticated:', isAuthenticated, 'isAuthModalOpen:', isAuthModalOpen);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 lg:p-12">
      {!isAuthenticated ? (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={login}
        />
      ) : (
        <MessagingInterface />
      )}
    </main>
  )
}