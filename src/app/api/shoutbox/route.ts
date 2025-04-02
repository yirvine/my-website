import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface Message {
  id: number
  username: string
  message: string
  timestamp: string
}

const MESSAGES_FILE = path.join(process.cwd(), "data", "shoutbox.json")

// Ensure the data directory exists
async function ensureDataDir() {
  const dir = path.join(process.cwd(), "data")
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir)
  }
}

// Read messages from file
async function readMessages(): Promise<Message[]> {
  try {
    await ensureDataDir()
    const data = await fs.readFile(MESSAGES_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Write messages to file
async function writeMessages(messages: Message[]) {
  await ensureDataDir()
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2))
}

export async function GET() {
  const messages = await readMessages()
  return NextResponse.json(messages)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { username, message } = body

  if (!username || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const messages = await readMessages()
  const newMessage: Message = {
    id: Date.now(),
    username: username.trim(),
    message: message.trim(),
    timestamp: new Date().toLocaleTimeString(),
  }

  // Add new message to the bottom and keep only last 5 messages
  const updatedMessages = [...messages, newMessage].slice(-5)
  await writeMessages(updatedMessages)
  
  return NextResponse.json(newMessage)
} 