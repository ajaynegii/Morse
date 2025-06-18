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
import { Menu, Moon, Sun, Send, MessageCircleMore, UserPlus, PlusCircle } from "lucide-react"
import { useTheme } from "next-themes"
import io from "socket.io-client"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"

const SOCKET_SERVER_URL = "http://localhost:5000"
let socket: any // Define socket outside to persist across renders

export function MessagingInterface() {
  const { token, userId, mobileNumber, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [allMessages, setAllMessages] = useState<Message[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [contacts, setContacts] = useState<Contact[]>([]) // This will be populated from backend
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [newContactMobileNumber, setNewContactMobileNumber] = useState('') // State for contact input
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const { theme, setTheme } = useTheme()

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    console.log("WebSocket useEffect: isAuthenticated =", isAuthenticated, "token =", !!token, "userId =", !!userId);

    if (!isAuthenticated || !token || !userId) {
      console.log("Not authenticated or missing token/userId, skipping socket connection.");
      if (socket && socket.connected) {
        socket.disconnect();
        console.log("Disconnected existing socket due to lack of authentication.");
      }
      return; // Do not connect if not authenticated
    }

    console.log("Attempting to connect socket...");
    if (socket && socket.connected) {
      console.log("Socket already connected, skipping re-connection.");
      socket.emit("authenticate", { token }); // Re-authenticate if already connected
      return;
    }

    socket = io(SOCKET_SERVER_URL);

    socket.on("connect", () => {
      console.log("🔗 Connected to WebSocket. Socket ID:", socket.id);
      console.log("Emitting 'authenticate' with token.");
      socket.emit("authenticate", { token });
    });

    socket.on("authenticated", (data: { userId: string; mobileNumber: string }) => {
      console.log("✅ Socket authenticated:", data);
      socket.isAuth = true; // Manually set isAuth property for debugging purposes
      fetchContacts();
      console.log("MessageInput disabled status after authentication:", !socket || !socket.isAuth); // Log the disabled status
    });

    socket.on("auth_error", (error: { message: string }) => {
      console.error("❌ Socket authentication error:", error.message);
      toast({
        title: "Authentication Error",
        description: error.message || "Could not authenticate with chat server.",
        variant: "destructive",
      });
      if (error.message.includes("jwt expired")) {
        logout();
        router.push("/login");
      }
      if (socket) { // Ensure socket exists before disconnecting
        socket.disconnect();
      }
      console.log("MessageInput disabled status after auth_error:", !socket || !socket.isAuth); // Log the disabled status
    });

    socket.on("history", (historyMessages: any[]) => {
      console.log("Received history:", historyMessages);
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
        attachment: msg.attachment,
        wordProtection: msg.wordProtection || undefined
      }))
      setAllMessages(formattedHistory)
      // Messages for the current chat will be filtered in a separate useEffect
      scrollToBottom()
    })

    socket.on("message", (newMessage: any) => {
      console.log("Received new message:", newMessage);
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
        attachment: newMessage.attachment,
        wordProtection: newMessage.wordProtection || undefined
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
      console.error("❌ Socket error:", error.message);
      toast({
        title: "Socket Error",
        description: error.message || "An error occurred with the chat connection.",
        variant: "destructive",
      });
      console.log("MessageInput disabled status after socket error:", !socket || !socket.isAuth); // Log the disabled status
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
      socket.isAuth = false; // Reset isAuth on disconnect
      toast({
        title: "Disconnected",
        description: "Lost connection to chat server.",
        variant: "destructive",
      });
      console.log("MessageInput disabled status after disconnect:", !socket || !socket.isAuth); // Log the disabled status
    });

    return () => {
      if (socket) {
        console.log("Cleaning up socket connection in cleanup function.");
        socket.off("connect");
        socket.off("authenticated");
        socket.off("auth_error");
        socket.off("history");
        socket.off("message");
        socket.off("error");
        socket.off("disconnect");
        socket.disconnect();
        socket = null; // Clear the socket instance
      }
    };
  }, [isAuthenticated, token, userId, selectedContact, toast, logout, router, fetchContacts]); // Added fetchContacts to dependencies

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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content: string, attachment?: Attachment) => {
    console.log("Attempting to send message. socket:", !!socket, "socket.isAuth:", socket?.isAuth, "selectedContact:", !!selectedContact);
    if ((!content.trim() && !attachment) || !selectedContact || !socket || !socket.isAuth) {
        console.warn("Message not sent: Missing content/attachment, selected contact, or socket not authenticated.");
        return;
    }

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

  const handleAddContact = useCallback(async () => {
    if (!token || !newContactMobileNumber) {
      toast({
        title: "Error",
        description: "Please enter a mobile number.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/contacts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mobileNumber: newContactMobileNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add contact");
      }

      toast({
        title: "Contact Added",
        description: `${newContactMobileNumber} has been added to your contacts.`, 
        variant: "default",
      });
      setNewContactMobileNumber(""); // Clear input
      fetchContacts(); // Refresh contact list
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: error.message || "Could not add contact.",
        variant: "destructive",
      });
    }
  }, [token, newContactMobileNumber, fetchContacts, toast]);

  return (
    <div className="flex h-screen w-full">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="lg:hidden absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="p-4 border-b flex flex-col gap-2">
            <Label htmlFor="new-contact-mobile" className="text-sm font-medium">Add New Contact</Label>
            <div className="flex space-x-2">
              <Input
                id="new-contact-mobile"
                placeholder="Enter mobile number"
                value={newContactMobileNumber}
                onChange={(e) => setNewContactMobileNumber(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddContact} size="icon" aria-label="Add Contact">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
        <div className="p-4 border-b flex flex-col gap-2">
          <Label htmlFor="new-contact-mobile-desktop" className="text-sm font-medium">Add New Contact</Label>
          <div className="flex space-x-2">
            <Input
              id="new-contact-mobile-desktop"
              placeholder="Enter mobile number"
              value={newContactMobileNumber}
              onChange={(e) => setNewContactMobileNumber(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddContact} size="icon" aria-label="Add Contact">
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
          <div className="flex items-center gap-3">
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
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
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
              <p className="text-sm text-muted-foreground mt-2">Or add a new contact using the sidebar.</p>
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