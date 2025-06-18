"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Send, Smile, Shield, AlertTriangle, CheckCircle, ChevronDown } from "lucide-react"
import { useState, type KeyboardEvent, useEffect, useRef } from "react"
import { FileUpload } from "./file-upload"
import { Attachment } from "@/lib/types"
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface MessageInputProps {
  onSendMessage: (content: string, attachment?: Attachment) => void
  disabled?: boolean
}

interface SpellCheckResult {
  correct: boolean
  suggestions: Array<{ word: string; distance: number }>
}

interface AutocompleteSuggestion {
  word: string
  frequency: number
  metadata: any
}

interface MessageAnalysis {
  bannedWords: Array<{ word: string; replacement: string; type: string }>
  spamPatterns: Array<{ pattern: string; type: string }>
  spellCheck: Array<{ word: string; suggestions: Array<{ word: string; distance: number }> }>
  filteredMessage: string
  isClean: boolean
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Attachment | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [spellCheckResults, setSpellCheckResults] = useState<SpellCheckResult[]>([])
  const [messageAnalysis, setMessageAnalysis] = useState<MessageAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentWord, setCurrentWord] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const API_BASE = "http://localhost:5000/api/word-protection"

  // Analyze message for word protection
  const analyzeMessage = async (text: string) => {
    if (!text.trim()) {
      setMessageAnalysis(null)
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await response.json()
      if (data.success) {
        setMessageAnalysis(data.analysis)
        
        // Show warning if message contains issues
        if (!data.analysis.isClean) {
          const issues = []
          if (data.analysis.bannedWords.length > 0) {
            issues.push(`${data.analysis.bannedWords.length} banned word(s)`)
          }
          if (data.analysis.spamPatterns.length > 0) {
            issues.push(`${data.analysis.spamPatterns.length} spam pattern(s)`)
          }
          if (data.analysis.spellCheck.length > 0) {
            issues.push(`${data.analysis.spellCheck.length} spelling issue(s)`)
          }
          
          toast({
            title: "Content Warning",
            description: `Message contains: ${issues.join(', ')}. Content will be filtered.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error analyzing message:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Get autocomplete suggestions
  const getAutocompleteSuggestions = async (prefix: string) => {
    if (!prefix.trim() || prefix.length < 2) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/autocomplete?prefix=${encodeURIComponent(prefix)}`)
      const data = await response.json()
      if (data.success && data.suggestions.length > 0) {
        setAutocompleteSuggestions(data.suggestions.slice(0, 5))
        setShowAutocomplete(true)
        setSelectedSuggestionIndex(0)
      } else {
        setShowAutocomplete(false)
      }
    } catch (error) {
      console.error("Error getting autocomplete suggestions:", error)
    }
  }

  // Spell check current word
  const spellCheckWord = async (word: string) => {
    if (!word.trim() || word.length < 3) return

    try {
      const response = await fetch(`${API_BASE}/spell-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      })
      const data = await response.json()
      if (data.success) {
        return data.result
      }
    } catch (error) {
      console.error("Error spell checking word:", error)
    }
    return null
  }

  // Handle message input changes
  const handleMessageChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)
    setCursorPosition(e.target.selectionStart)

    // Get current word for autocomplete
    const words = newMessage.split(/\s+/)
    const currentWordIndex = newMessage.substring(0, e.target.selectionStart).split(/\s+/).length - 1
    const currentWord = words[currentWordIndex] || ""
    setCurrentWord(currentWord)

    // Analyze message for protection issues
    if (newMessage.trim()) {
      analyzeMessage(newMessage)
    } else {
      setMessageAnalysis(null)
    }

    // Get autocomplete suggestions for current word
    if (currentWord.length >= 2) {
      getAutocompleteSuggestions(currentWord)
    } else {
      setShowAutocomplete(false)
    }
  }

  // Handle autocomplete selection
  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    const words = message.split(/\s+/)
    const currentWordIndex = message.substring(0, cursorPosition).split(/\s+/).length - 1
    
    if (currentWordIndex >= 0 && currentWordIndex < words.length) {
      words[currentWordIndex] = suggestion.word
      const newMessage = words.join(" ")
      setMessage(newMessage)
      
      // Set cursor position after the replaced word
      const beforeWord = message.substring(0, cursorPosition).split(/\s+/).slice(0, currentWordIndex).join(" ")
      const newPosition = beforeWord.length + (beforeWord.length > 0 ? 1 : 0) + suggestion.word.length
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPosition, newPosition)
          textareaRef.current.focus()
        }
      }, 0)
    }
    
    setShowAutocomplete(false)
  }

  // Handle keyboard navigation for autocomplete
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => 
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => 
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
        )
        return
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault()
        handleAutocompleteSelect(autocompleteSuggestions[selectedSuggestionIndex])
        return
      }
      if (e.key === "Escape") {
        setShowAutocomplete(false)
        return
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      setIsSending(true)
      
      // Use filtered message if available, otherwise use original
      const messageToSend = messageAnalysis?.filteredMessage || message
      
      setTimeout(() => {
        onSendMessage(messageToSend, selectedFile || undefined)
        setMessage("")
        setSelectedFile(null)
        setIsSending(false)
        setShowEmojiPicker(false)
        setShowAutocomplete(false)
        setMessageAnalysis(null)
      }, 300)
    }
  }

  const handleFileSelect = (attachment: Attachment) => {
    setSelectedFile(attachment)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prevMessage) => prevMessage + emojiData.emoji)
  }

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAutocomplete(false)
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className="p-4 border-t backdrop-blur-sm bg-background/80">
      {/* Word Protection Status */}
      {messageAnalysis && (
        <div className="mb-3 flex items-center gap-2">
          {messageAnalysis.isClean ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Message is clean
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Content will be filtered
            </Badge>
          )}
          
          {messageAnalysis.bannedWords.length > 0 && (
            <Badge variant="outline" className="text-red-600">
              {messageAnalysis.bannedWords.length} banned word(s)
            </Badge>
          )}
          
          {messageAnalysis.spellCheck.length > 0 && (
            <Badge variant="outline" className="text-blue-600">
              {messageAnalysis.spellCheck.length} spelling issue(s)
            </Badge>
          )}
          
          {isAnalyzing && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      )}

      <div className="flex items-end gap-2">
        <FileUpload
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          selectedFile={selectedFile}
          disabled={disabled || isSending}
        />

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full p-3 pr-10 rounded-lg bg-muted resize-none min-h-[50px] max-h-[150px] overflow-y-auto transition-all duration-200 focus:ring-2 focus:ring-primary/50"
            placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (currentWord.length >= 2) {
                setShowAutocomplete(true)
              }
            }}
            rows={1}
            disabled={disabled || isSending}
          />
          
          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 rounded-full"
            title="Add emoji"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={disabled || isSending}
          >
            <Smile className="h-5 w-5" />
          </Button>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" width={300} height={400} />
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 z-50 bg-background border rounded-lg shadow-lg max-w-xs">
              <div className="p-2 border-b">
                <span className="text-xs text-muted-foreground">Suggestions for "{currentWord}"</span>
              </div>
              {autocompleteSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between",
                    index === selectedSuggestionIndex && "bg-muted"
                  )}
                  onClick={() => handleAutocompleteSelect(suggestion)}
                >
                  <span>{suggestion.word}</span>
                  <span className="text-xs text-muted-foreground">
                    f: {suggestion.frequency}
                  </span>
                </button>
              ))}
              <div className="p-2 border-t text-xs text-muted-foreground">
                Use ↑↓ to navigate, Tab/Enter to select, Esc to close
              </div>
            </div>
          )}
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
