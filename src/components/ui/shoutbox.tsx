"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: number
  username: string
  message: string
  timestamp: string
}

export function Shoutbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Load messages from API on component mount
  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/shoutbox")
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !message.trim()) return

    try {
      const response = await fetch("/api/shoutbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          message: message.trim(),
        }),
      })

      if (!response.ok) throw new Error("Failed to post message")

      const newMessage = await response.json()
      // Add new message to the bottom
      setMessages((prev) => [...prev, newMessage].slice(-5))
      setMessage("")
    } catch (error) {
      console.error("Failed to post message:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="h-[200px] overflow-y-auto space-y-2 p-2 bg-black/20 rounded-lg">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet. Be the first to shout!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="font-mono text-yellow-400">{msg.username}</span>
              <span className="text-gray-400 mx-2">[{msg.timestamp}]</span>
              <span className="text-gray-300">{msg.message}</span>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="font-mono bg-black/20 border-gray-700"
        />
        <Textarea
          placeholder="Your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="font-mono bg-black/20 border-gray-700 h-20"
        />
        <Button type="submit" className="w-full font-mono bg-yellow-400 hover:bg-yellow-500 text-black">
          Shout!
        </Button>
      </form>
    </div>
  )
} 