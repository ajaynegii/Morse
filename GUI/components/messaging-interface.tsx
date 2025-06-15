"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ContactList } from "@/components/contact-list"
import { ChatArea } from "@/components/chat-area"
import { MessageInput } from "@/components/message-input"
import { MessageBubble } from "@/components/message-bubble"
import type { Contact, Message, Attachment } from "@/lib/types"
import { initialContacts, initialMessages } from "@/lib/mock-data"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Menu, Moon, Sun, Send, MessageCircleMore, UserPlus } from "lucide-react"
import { useTheme } from "next-themes"
import io from "socket.io-client"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const SOCKET_SERVER_URL = "http://localhost:5000"
let socket: any // Define socket outside to persist across renders

export function MessagingInterface() {
  const { token, userId, mobileNumber, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([]) // This will be populated from backend
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const { theme, setTheme } = useTheme()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    if (!isAuthenticated || !token || !userId) {
      console.log("Not authenticated, skipping socket connection.")
      return // Do not connect if not authenticated
    }

    console.log("Attempting to connect socket...")
    socket = io(SOCKET_SERVER_URL)

    socket.on("connect", () => {
      console.log("🔗 Connected to WebSocket")
      // Authenticate with the backend after connection
      socket.emit("authenticate", { token })
    })

    socket.on("authenticated", (data: { userId: string; mobileNumber: string }) => {
      console.log("✅ Socket authenticated:", data)
      // Now that socket is authenticated, fetch contacts
      fetchContacts()
    })

    socket.on("auth_error", (error: { message: string }) => {
      console.error("❌ Socket authentication error:", error.message)
      toast({
        title: "Authentication Error",
        description: error.message || "Could not authenticate with chat server.",
        variant: "destructive",
      })
      socket.disconnect()
    })

    socket.on("history", (historyMessages: any[]) => {
      console.log("Received history:", historyMessages)
      const formattedHistory: Message[] = historyMessages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderMobileNumber: msg.senderMobileNumber,
        receiverId: msg.receiverId,
        receiverMobileNumber: msg.receiverMobileNumber,
        content: msg.message, // Backend now sends decrypted message as 'message'
        timestamp: new Date(msg.timestamp),
        status: "delivered", // Assume delivered for history
        hasAttachment: msg.hasAttachment,
        attachment: msg.attachment
      }))
      setAllMessages(formattedHistory)
      // Messages for the current chat will be filtered in a separate useEffect
      scrollToBottom()
    })

    socket.on("message", (newMessage: any) => {
      console.log("Received new message:", newMessage)
      const formattedMessage: Message = {
        id: newMessage.id,
        senderId: newMessage.senderId,
        senderMobileNumber: newMessage.senderMobileNumber,
        receiverId: newMessage.receiverId,
        receiverMobileNumber: newMessage.receiverMobileNumber,
        content: newMessage.message,
        timestamp: new Date(newMessage.timestamp),
        status: newMessage.status || "delivered", // Default to delivered
        hasAttachment: newMessage.hasAttachment,
        attachment: newMessage.attachment
      }

      setAllMessages((prevMessages) => [...prevMessages, formattedMessage])

      // Only add message to current conversation view if it's for the current conversation
      if (
        (formattedMessage.senderId === userId && formattedMessage.receiverId === selectedContact?.id) ||
        (formattedMessage.senderId === selectedContact?.id && formattedMessage.receiverId === userId)
      ) {
        setMessages((prev) => [...prev, formattedMessage])
      } else if (formattedMessage.receiverId === userId) {
        // Optionally, show a toast for new messages from other contacts
        toast({
          title: `New message from ${formattedMessage.senderMobileNumber}`,
          description: formattedMessage.content || "Sent an attachment",
          duration: 3000,
        })
      }
      scrollToBottom()
    })

    socket.on("error", (error: { message: string }) => {
      console.error("❌ Socket error:", error.message)
      toast({
        title: "Socket Error",
        description: error.message || "An error occurred with the chat connection.",
        variant: "destructive",
      })
    })

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket")
      toast({
        title: "Disconnected",
        description: "Lost connection to chat server.",
        variant: "destructive",
      })
    })

    return () => {
      if (socket) {
        console.log("Cleaning up socket connection.")
        socket.off("connect")
        socket.off("authenticated")
        socket.off("auth_error")
        socket.off("history")
        socket.off("message")
        socket.off("error")
        socket.off("disconnect")
        socket.disconnect()
      }
    }
  }, [isAuthenticated, token, userId, selectedContact, toast]) // Re-run if auth state or selected contact changes

  useEffect(() => {
    if (userId && selectedContact) {
      const filtered = allMessages.filter(
        (msg) =>
          (msg.senderId === userId && msg.receiverId === selectedContact.id) ||
          (msg.senderId === selectedContact.id && msg.receiverId === userId)
      )
      setMessages(filtered)
      scrollToBottom()
    } else {
      setMessages([]) // Clear messages if no contact is selected
    }
  }, [selectedContact, allMessages, userId]) // Dependencies

  const fetchContacts = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch("http://localhost:5000/api/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch contacts")
      const data = await response.json()
      const fetchedContacts: Contact[] = data.map((user: any) => ({
        id: user._id,
        name: user.mobileNumber, // Display mobile number as contact name
        mobileNumber: user.mobileNumber,
        avatar: `/api/placeholder/40/40`, // Placeholder avatar
        lastMessage: "",
        lastMessageTime: undefined,
        unreadCount: 0,
      }))
      setContacts(fetchedContacts)
      if (fetchedContacts.length > 0 && !selectedContact) {
        setSelectedContact(fetchedContacts[0]) // Auto-select first contact
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast({ title: "Error", description: "Failed to load contacts.", variant: "destructive" })
    }
  }, [token, selectedContact, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string, attachment?: Attachment) => {
    if ((!content.trim() && !attachment) || !selectedContact || !socket || !socket.isAuth) return

    const messageToSend = {
      receiverId: selectedContact.id, // Send receiver's User ID
      message: content.trim() || undefined,
      attachment: attachment || undefined
    }

    console.log("Emitting message:", messageToSend)
    socket.emit("message", messageToSend)
  }

  const handleDownload = (attachment: any) => {
    const link = document.createElement('a')
    link.href = `http://localhost:5000${attachment.path}`
    link.download = attachment.name
    link.click()
    link.remove()
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
        <p className="text-lg text-muted-foreground">Please sign in to start chatting.</p>
      </div>
    )
  }

  if (contacts.length === 0 && !selectedContact) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-background p-4 text-center">
        <MessageCircleMore className="w-24 h-24 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Contacts Yet!</h2>
        <p className="text-muted-foreground mb-4">It looks like you haven't added any contacts. Start by adding a new chat to connect with friends.</p>
        <Button onClick={() => setIsSidebarOpen(true)} className="mt-4">
          <UserPlus className="mr-2 h-5 w-5" /> Add New Contact
        </Button>
        <p className="text-sm text-muted-foreground mt-4">Or open the sidebar and click the '+' button to add contacts.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <ContactList
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={(contact) => {
              setSelectedContact(contact)
              setIsSidebarOpen(false) // Close sidebar on contact select
            }}
            onCloseSidebar={() => setIsSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block w-80 border-r">
        <ContactList
          contacts={contacts}
          selectedContact={selectedContact}
          onSelectContact={(contact) => {
            setSelectedContact(contact)
          }}
        />
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b p-4 shadow-sm">
          <div className="absolute top-4 right-4 z-10">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>

          {selectedContact ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedContact.avatar} />
                <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-lg">{selectedContact.name}</h2>
            </div>
          ) : (
            <h2 className="font-semibold text-lg text-muted-foreground">Select a chat</h2>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 backdrop-blur-sm">
          {selectedContact ? (
            messages.length > 0 ? (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMe={msg.senderId === userId}
                  contactName={selectedContact.name}
                  contactAvatar={selectedContact.avatar || ""}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Say hello to {selectedContact.name}!</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full flex-col text-center text-muted-foreground">
              <MessageCircleMore className="w-24 h-24 text-primary mb-4" />
              <p className="text-lg">Select a contact to start chatting.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedContact && (
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={!socket || !socket.isAuth}
          />
        )}
      </div>
    </div>
  )
}