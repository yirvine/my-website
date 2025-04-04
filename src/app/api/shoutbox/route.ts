import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
// Vercel automatically injects these when the Upstash integration is added
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define the structure of a message
interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string; // Simple time string for display
}

const MESSAGES_KEY = 'shoutbox_messages'; // Key for storing the list in Redis
const MAX_MESSAGES = 50; // Keep the latest 50 messages in Redis

// GET handler to fetch messages
export async function GET() {
  try {
    // Fetch the entire list of messages (stored as strings)
    // LRANGE messages 0 -1 fetches all elements
    const messageStrings = await redis.lrange(MESSAGES_KEY, 0, -1);

    // Parse the message strings back into objects
    const messages: Message[] = messageStrings.map((msgStr) => JSON.parse(msgStr));

    // Return the messages (the frontend will slice to show only 5)
    return NextResponse.json(messages);

  } catch (error) {
    console.error("Error fetching messages from Redis:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST handler to add a new message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, message } = body;

    // Basic validation
    if (!username || typeof username !== 'string' || !message || typeof message !== 'string') {
      return NextResponse.json({ error: "Invalid input: username and message are required" }, { status: 400 });
    }

    // Create new message object
    const newMessage: Message = {
      id: Date.now(), // Use timestamp as a unique ID
      username: username.trim().slice(0, 50), // Trim and limit length
      message: message.trim().slice(0, 280), // Trim and limit length
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    // Add the new message (as a string) to the end of the list
    await redis.rpush(MESSAGES_KEY, JSON.stringify(newMessage));

    // Trim the list to keep only the latest MAX_MESSAGES
    // LTRIM messages -50 -1 keeps elements from index -50 (50th from end) to -1 (last)
    await redis.ltrim(MESSAGES_KEY, -MAX_MESSAGES, -1);

    // Return the newly created message (frontend expects this)
    return NextResponse.json(newMessage, { status: 201 }); // 201 Created status

  } catch (error) {
    console.error("Error posting message to Redis:", error);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}

// Optional: Handle cases where the method is not GET or POST
export async function handler(request: Request) {
    return NextResponse.json({ error: `Method ${request.method} Not Allowed` }, { status: 405 });
} 