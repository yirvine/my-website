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

  // Load messages from API on component mount and set up polling
  useEffect(() => {
    // Define fetch function *inside* the effect
    const fetchMessages = async () => {
      // Keep isLoading logic only for the very first load?
      // setIsLoading(true); // Removed setIsLoading(true) here to prevent flicker on poll
      try {
        const response = await fetch("/api/shoutbox")
        if (!response.ok) {
          console.error("Poll failed:", response.status);
          return; // Exit without updating state on failed poll
        }
        const data = await response.json()
        // Ensure data is an array before slicing
        setMessages(Array.isArray(data) ? data.slice(-5) : []); 
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      } finally {
        // Ensure loading is false after the *initial* load attempt
        // Check if state is still true before setting to false
        setIsLoading(currentLoadingState => currentLoadingState ? false : currentLoadingState);
      }
    };

    // Fetch initially
    fetchMessages();

    // Set up polling interval (e.g., every 10 seconds)
    const intervalId = setInterval(fetchMessages, 10000); // 10000 ms = 10 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array is now correct because fetchMessages is defined inside

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !message.trim()) return

    // Disable button while submitting? (Optional UX improvement)
    const currentUsername = username.trim();
    const currentMessage = message.trim();

    // Clear input field immediately for better UX
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

      // Trigger a fetch manually AFTER successful post
      // We need to call the fetch defined inside the effect, which isn't directly accessible here.
      // A simple way is to slightly restructure or use a ref/state to trigger a fetch.
      // Let's simplify: Assume the poll will catch it soon enough or handle differently.
      // For now, we remove the manual fetch from here as it's complex to call the effect's internal function.
      // The next poll interval (max 10s) will show the new message.
      // fetchMessages(); // Cannot call the effect's internal fetchMessages here easily

    } catch (error) {
      console.error("Failed to post message:", error)
      setMessage(currentMessage); // Restore message on error
      // Optionally show an error message to the user
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