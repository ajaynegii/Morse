"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, LogOut } from "lucide-react"
import type { Contact, SearchUser } from "@/lib/types"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ContactListProps {
  contacts: Contact[]
  selectedContact: Contact | null
  onSelectContact: (contact: Contact) => void
  onCloseSidebar?: () => void
}

export function ContactList({
  contacts: initialContacts,
  selectedContact,
  onSelectContact,
  onCloseSidebar,
}: ContactListProps) {
  const { token, userId, mobileNumber, logout } = useAuth()
  const { toast } = useToast()
  const [displayContacts, setDisplayContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [addContactModalOpen, setAddContactModalOpen] = useState(false)
  const [searchMobile, setSearchMobile] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)

  useEffect(() => {
    if (token) {
      fetchContacts()
    }
  }, [token])

  useEffect(() => {
    if (searchQuery) {
      setDisplayContacts(initialContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.mobileNumber.includes(searchQuery)
      ))
    } else {
      setDisplayContacts(initialContacts)
    }
  }, [searchQuery, initialContacts])

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://192.168.29.15:5000/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()

      const fetchedContacts: Contact[] = data.map((user: SearchUser) => ({
        id: user._id,
        name: user.mobileNumber,
        mobileNumber: user.mobileNumber,
        avatar: `/api/placeholder/40/40`,
        status: "online"
      }))
      const filteredContacts = fetchedContacts.filter(contact => contact.mobileNumber !== mobileNumber)
      setDisplayContacts(filteredContacts)
      toast({ title: "Contacts loaded", description: `Found ${filteredContacts.length} contacts.` })
    } catch (error) {
      console.error("Error fetching contacts:", error)
      toast({ title: "Error", description: "Failed to load contacts.", variant: "destructive" })
    }
  }

  const handleSearchUsers = async () => {
    if (!searchMobile || !token) return
    setIsSearching(true)
    setSearchResults([])
    try {
      const response = await fetch(`http://192.168.29.15:5000/api/contacts/search?mobileNumber=${searchMobile}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to search users')
      const data = await response.json()
      setSearchResults(data)
      if (data.length === 0) {
        toast({ title: "No results", description: "No users found with that mobile number." })
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast({ title: "Error", description: "Failed to search users.", variant: "destructive" })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddContact = async (contactId: string, contactMobile: string) => {
    if (!token) return
    setIsAddingContact(true)
    try {
      const response = await fetch('http://192.168.29.15:5000/api/contacts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contactId }),
      })
      if (!response.ok) throw new Error('Failed to add contact')
      const data = await response.json()
      toast({ title: "Success", description: `Added ${contactMobile} as a contact.` })
      setAddContactModalOpen(false)
      setSearchMobile("")
      setSearchResults([])
      fetchContacts()
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({ title: "Error", description: "Failed to add contact.", variant: "destructive" })
    } finally {
      setIsAddingContact(false)
    }
  }

  const handleLogout = () => {
    logout()
    onCloseSidebar?.()
  }

  return (
    <div className="flex h-full flex-col bg-card shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-xl font-semibold">Chats</h2>
        <div className="flex items-center gap-2">
          <Dialog open={addContactModalOpen} onOpenChange={setAddContactModalOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Add contact">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>Search for users by mobile number to add them to your contacts.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="searchMobile" className="text-right">Mobile No.</Label>
                  <Input
                    id="searchMobile"
                    type="tel"
                    value={searchMobile}
                    onChange={(e) => setSearchMobile(e.target.value)}
                    placeholder="e.g., 9876543210"
                    className="col-span-3"
                  />
                </div>
                <Button onClick={handleSearchUsers} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
                {searchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">Search Results</h3>
                    {searchResults.map((user) => (
                      <div key={user._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <span>{user.mobileNumber}</span>
                        <Button onClick={() => handleAddContact(user._id, user.mobileNumber)} disabled={isAddingContact}>
                          {isAddingContact ? "Adding..." : "Add"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" aria-label="Logout" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="relative p-4">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          placeholder="Search chats..."
          className="pl-12 pr-4 py-2 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayContacts.map((contact) => (
          <div
            key={contact.id}
            className={cn(
              "contact-agent47 flex items-center gap-3 px-4 py-3 cursor-pointer transition-all",
              selectedContact?.id === contact.id ? "selected" : "",
            )}
            onClick={() => {
              onSelectContact(contact)
              onCloseSidebar?.()
            }}
          >
            <Avatar>
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{contact.name}</h3>
                {contact.lastMessageTime && (
                  <span className="text-xs text-muted-foreground">
                    {contact.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {contact.lastMessage || "No messages yet."}
              </p>
            </div>
            {contact.unreadCount && contact.unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {contact.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
