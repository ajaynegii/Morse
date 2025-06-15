"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, X, File, Image, Download } from "lucide-react"
import { Attachment } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadProps {
  onFileSelect: (attachment: Attachment) => void
  onRemoveFile: () => void
  selectedFile?: Attachment | null
  disabled?: boolean
}

export function FileUpload({ onFileSelect, onRemoveFile, selectedFile, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'application/zip', 'application/x-zip-compressed'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image, document, or common file type",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://192.168.29.15:5000/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      onFileSelect(result.file)
      
      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-4 w-4" />
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

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a')
    link.href = `http://192.168.29.15:5000${attachment.path}`
    link.download = attachment.originalname
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        disabled={disabled || isUploading}
      />
      
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        title="Attach file"
      >
        {isUploading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </Button>

      {selectedFile && (
        <div className="flex items-center gap-2 bg-muted rounded-lg p-2 max-w-[200px]">
          {getFileIcon(selectedFile.mimetype)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.originalname}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDownload(selectedFile)}
              title="Download file"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onRemoveFile}
              title="Remove file"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 