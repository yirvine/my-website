import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Use Redis.fromEnv() as recommended by Vercel
const redis = Redis.fromEnv();

// Define the structure of a message
interface Message {
  id: number;
  username: string;
  message: string;
  timestamp: string; // Simple time string for display
}

const MESSAGES_KEY = 'shoutbox_messages'; // Key for storing the list in Redis
const MAX_MESSAGES = 50; // Keep the latest 50 messages in Redis

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = async (req: NextRequest) => {
  try {
    console.log("GET /api/shoutbox called"); // Log entry

    // Fetch data. The Upstash client with fromEnv() likely returns objects already.
    const messages: Message[] = await redis.lrange(MESSAGES_KEY, 0, MAX_MESSAGES - 1);
    console.log("Raw/Parsed messages from Redis:", messages);

    // No need to parse manually, the client seems to handle it.
    // const messages: Message[] = messageStrings.reduce((acc: Message[], msgStr) => {
    //   try {
    //     acc.push(JSON.parse(msgStr));
    //   } catch (parseError) {
    //     console.error(`Failed to parse message string: ${msgStr}`, parseError); 
    //     // Skip this message if it fails to parse
    //   }
    //   return acc;
    // }, []);

    console.log(`Returning ${messages.length} messages.`);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error); // Log detailed error
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
};

// POST handler to add a new message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, message } = body;

    if (!username || typeof username !== 'string' || !message || typeof message !== 'string') {
      return NextResponse.json({ error: "Invalid input: username and message are required" }, { status: 400 });
    }

    const newMessage: Message = {
      id: Date.now(),
      username: username.trim().slice(0, 50),
      message: message.trim().slice(0, 280),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    // Explicitly stringify the object
    const messageString = JSON.stringify(newMessage);

    // Log exactly what is being sent to Redis
    console.log(`Attempting rpush with key '${MESSAGES_KEY}', value type: ${typeof messageString}, value: ${messageString}`);

    // Add the stringified message to the end of the list
    const pushResult = await redis.rpush(MESSAGES_KEY, messageString);
    console.log(`rpush result (new list length): ${pushResult}`);

    // Trim the list to keep only the latest MAX_MESSAGES
    const trimResult = await redis.ltrim(MESSAGES_KEY, -MAX_MESSAGES, -1);
    console.log(`ltrim result: ${trimResult}`);

    return NextResponse.json(newMessage, { status: 201 });

  } catch (error: unknown) {
    console.error("Error posting message to Redis:", error); // Log the actual error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to post message", details: errorMessage }, { status: 500 });
  }
} 