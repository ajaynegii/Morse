"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Send, Smile } from "lucide-react"
import { useState, type KeyboardEvent } from "react"
import { FileUpload } from "./file-upload"
import { Attachment } from "@/lib/types"

interface MessageInputProps {
  onSendMessage: (content: string, attachment?: Attachment) => void
  disabled?: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null)

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      setIsSending(true)
      setTimeout(() => {
        onSendMessage(message, selectedFile || undefined)
        setMessage("")
        setSelectedFile(null)
        setIsSending(false)
      }, 300)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (attachment: Attachment) => {
    setSelectedFile(attachment)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="p-4 border-t backdrop-blur-sm bg-background/80">
      <div className="flex items-end gap-2">
        <FileUpload
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          selectedFile={selectedFile}
          disabled={disabled || isSending}
        />

        <div className="flex-1 relative">
          <textarea
            className="w-full p-3 pr-10 rounded-lg bg-muted resize-none min-h-[50px] max-h-[150px] overflow-y-auto transition-all duration-200 focus:ring-2 focus:ring-primary/50"
            placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled || isSending}
          />
          <Button variant="ghost" size="icon" className="absolute right-2 bottom-2 rounded-full" title="Add emoji">
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        <Button
          size="icon"
          className={cn("rounded-full transition-all duration-300", isSending && "animate-pulse")}
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isSending || disabled}
        >
          <Send className={cn("h-5 w-5 transition-transform", isSending && "translate-x-1 -translate-y-1")} />
        </Button>
      </div>
    </div>
  )
}
