import { type NextRequest, NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';
// import { cookies } from 'next/headers'; // No longer using cookies

// Simple interface for profile data needed
interface UserProfile {
  display_name?: string;
  id: string;
  email?: string; // Depending on scopes requested
}

interface SpotifyErrorBody {
    error?: { message?: string };
    // Add other potential error fields if known
}

interface SpotifyApiError {
    statusCode?: number;
    body?: SpotifyErrorBody;
    message?: string;
}

// NOTE: This route is only needed if the client-side component cannot get the user info
// directly from the redirect parameters (like display_name). If the client already has
// the necessary info (e.g., ID or display name) passed via URL, this route might be redundant.
export async function GET(request: NextRequest) {
  // Read token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.split(' ')?.[1]; // Extract token after 'Bearer '

  if (!accessToken) {
    console.error('[API /quiz/me] Missing Authorization header or token');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('[API /quiz/me] Access token found in header, fetching user profile...');

  const spotifyApi = new SpotifyWebApi(); // No need for credentials here
  spotifyApi.setAccessToken(accessToken);

  try {
    const meData = await spotifyApi.getMe();
    
    // Select only the necessary profile fields
    const profile: UserProfile = {
      display_name: meData.body.display_name,
      id: meData.body.id,
      email: meData.body.email, // Include if needed and scope allows
    };

    console.log('[API /quiz/me] Successfully fetched user profile.');
    return NextResponse.json(profile);

  } catch (error: unknown) {
    console.error('[API /quiz/me] Error fetching user profile from Spotify:', error);
    
    // Type assertion after checking it's likely the expected error shape
    const spotifyError = error as SpotifyApiError;
    const statusCode = spotifyError?.statusCode || 500;
    const errorMessage = spotifyError?.body?.error?.message || spotifyError?.message || 'Failed to fetch user profile';
    
    if (statusCode === 401) {
        return NextResponse.json({ error: 'Invalid or expired Spotify token' }, { status: 401 });
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
} 