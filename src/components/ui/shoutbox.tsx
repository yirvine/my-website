"use client"

import { useState, useEffect, useCallback } from "react"
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

  // Define fetch function outside useEffect, wrapped in useCallback
  const fetchMessages = useCallback(async () => {
    // Only set loading for the very first fetch if needed, otherwise skip.
    // We might want to remove setIsLoading entirely from here if it causes flicker on manual refresh.
    // setIsLoading(true); 
    try {
      const response = await fetch("/api/shoutbox")
      if (!response.ok) {
        console.error("Fetch failed:", response.status);
        return; // Exit without updating state on failed fetch
      }
      const data = await response.json()
      // Extract the 'messages' array from the response object
      setMessages(Array.isArray(data.messages) ? data.messages.slice(-15) : []);
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      // Ensure loading is false after the *initial* load attempt
      setIsLoading(currentLoadingState => currentLoadingState ? false : currentLoadingState);
    }
  }, [setMessages, setIsLoading]); // Dependency array for useCallback

  // Load messages initially and set up polling
  useEffect(() => {
    // Fetch initially
    fetchMessages();

    // Set up polling interval (e.g., every 1 minutes)
    const intervalId = setInterval(fetchMessages, 1800000); // 1800000 ms = 30 minutes

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [fetchMessages]); // fetchMessages is now a dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !message.trim()) return

    const currentUsername = username.trim();
    const currentMessage = message.trim();

    setMessage("")

    try {
      const response = await fetch("/api/shoutbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: currentUsername,
          message: currentMessage,
        }),
      })

      if (!response.ok) throw new Error("Failed to post message")

      // Fetch messages immediately after successful post
      fetchMessages(); 

    } catch (error) {
      console.error("Failed to post message:", error)
      setMessage(currentMessage); // Restore message on error
    }
  }

  return (
    <div className="space-y-3">
      <div className="h-[120px] overflow-y-auto space-y-2 p-2 bg-black/20 rounded-lg">
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
          className="font-mono bg-black/20 border-gray-700 h-16"
        />
        <Button type="submit" className="w-full font-mono bg-yellow-400 hover:bg-yellow-500 text-black">
          send it
        </Button>
      </form>
    </div>
  )
} 