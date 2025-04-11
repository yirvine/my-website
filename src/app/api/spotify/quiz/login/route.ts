import { NextResponse, type NextRequest } from 'next/server';
// import { cookies } from 'next/headers';
import SpotifyWebApi from 'spotify-web-api-node';
// import crypto from 'crypto';

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_QUIZ_CLIENT_ID;
const redirectUri = process.env.SPOTIFY_QUIZ_REDIRECT_URI;

// Define the scopes needed for the quiz
// user-top-read is essential
const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read' 
];

export async function GET(request: NextRequest) {
  if (!clientId || !redirectUri) {
    console.error('Spotify credentials missing in environment variables for quiz login.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Read state from query parameter provided by the client
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');

  if (!state) {
      console.error('[Login Route] State parameter missing from request URL.');
      // Redirect back to quiz page with an error? Or return JSON error?
      // Redirecting might be better UX
      return NextResponse.redirect(new URL('/quiz?error=Missing+State', request.url));
  }
  
  console.log('[Login Route] Received state from client:', state);

  const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    redirectUri: redirectUri,
  });

  // Create the authorization URL using the state received from the client
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  console.log('[Login Route] Generated Spotify Authorize URL:', authorizeURL);

  // Simply redirect to Spotify - no need to set a cookie here anymore
  return NextResponse.redirect(authorizeURL);

  // --- REMOVED COOKIE SETTING LOGIC ---
  // const response = NextResponse.redirect(authorizeURL);
  // const isSecure = process.env.NODE_ENV === 'production';
  // response.cookies.set('spotify_auth_state_quiz', state, { ... });
  // console.log(...) 
  // return response;
} 