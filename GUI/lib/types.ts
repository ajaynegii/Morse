export interface Contact {
  id: string
  name: string
  mobileNumber: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount?: number
  avatar?: string
}

export interface Attachment {
  filename: string
  originalname: string
  mimetype: string
  size: number
  path: string
}

export interface WordProtectionMetadata {
  isClean: boolean
  bannedWordsCount: number
  spamPatternsCount: number
  spellCheckIssues: number
  wasFiltered: boolean
}

export interface Message {
  id: string
  senderId: string
  senderMobileNumber: string
  receiverId: string
  receiverMobileNumber: string
  content: string
  timestamp: Date
  status: "sent" | "delivered" | "read"
  hasAttachment?: boolean
  attachment?: Attachment
  wordProtection?: WordProtectionMetadata
}

export interface SearchUser {
  _id: string
  mobileNumber: string
}
