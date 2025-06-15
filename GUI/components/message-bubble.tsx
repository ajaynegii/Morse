import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Check, CheckCheck, File, Image, Download, FileText } from "lucide-react"

interface MessageBubbleProps {
  message: Message
  isMe: boolean
  contactName: string
  contactAvatar: string
}

export function MessageBubble({ message, isMe, contactName, contactAvatar }: MessageBubbleProps) {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (mimetype === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDownload = (attachment: any) => {
    const link = document.createElement('a')
    link.href = `http://192.168.29.15:5000${attachment.path}`
    link.download = attachment.originalname
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className={cn("flex gap-2 max-w-[80%] animate-message-in", isMe ? "ml-auto flex-row-reverse" : "")}
      style={{
        animationDelay: "0.1s",
      }}
    >
      {!isMe && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={contactAvatar || "/placeholder.svg"} alt={contactName} />
          <AvatarFallback>{contactName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "rounded-lg p-3 min-w-[120px] shadow-sm transition-all",
          isMe
            ? "bg-primary text-primary-foreground rounded-tr-none dark:bg-primary/90"
            : "bg-muted rounded-tl-none dark:bg-gray-800",
        )}
      >
        {/* File Attachment */}
        {message.hasAttachment && message.attachment && (
          <div className="mb-3 p-3 bg-background/20 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              {message.attachment.mimetype.startsWith('image/') ? (
                <img
                  src={`http://192.168.29.15:5000${message.attachment.path}`}
                  alt={message.attachment.originalname}
                  className="h-16 w-16 object-cover rounded-lg"
                />
              ) : (
                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                  {getFileIcon(message.attachment.mimetype)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.attachment.originalname}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(message.attachment.size)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 mt-1"
                  onClick={() => handleDownload(message.attachment)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        <div className={cn("flex items-center gap-1 text-xs mt-1", isMe ? "justify-end" : "")}>
          <span className={isMe ? "text-primary-foreground/70" : "text-muted-foreground"}>{formattedTime}</span>

          {isMe && (
            <span className="text-primary-foreground/70">
              {message.status === "read" ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
