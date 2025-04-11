import { NextResponse, type NextRequest } from 'next/server';
// import { cookies } from 'next/headers'; // No longer reading state cookie or setting token cookie
import SpotifyWebApi from 'spotify-web-api-node';
// import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'; // No longer needed

const clientId = process.env.NEXT_PUBLIC_SPOTIFY_QUIZ_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_QUIZ_CLIENT_SECRET;
const redirectUri = process.env.SPOTIFY_QUIZ_REDIRECT_URI;

interface SpotifyErrorBody {
    error?: string;
    error_description?: string;
}

interface SpotifyError {
    body?: SpotifyErrorBody;
    message?: string;
    statusCode?: number;
}

export async function GET(request: NextRequest) {
  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Spotify credentials missing in environment variables for quiz callback.');
    return NextResponse.redirect(new URL('/quiz?error=Configuration+Error', request.url));
  }

  // console.log('[Callback Route] Incoming Headers:', Object.fromEntries(request.headers.entries())); // Keep or remove logging as needed

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Read state from URL again

  // Check for state from Spotify
  if (!state) {
      console.error('State parameter missing from Spotify callback URL.');
      return NextResponse.redirect(new URL('/quiz?error=Missing+State+From+Spotify', request.url));
  }
  console.log('[Callback Route] State from URL:', state); // Log it
  
  // Check for code existence
  if (!code) {
    console.error('Authorization code missing from Spotify callback.');
    return NextResponse.redirect(new URL('/quiz?error=Authorization+Failed', request.url));
  }

  // 2. Exchange Code for Tokens
  const spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUri: redirectUri,
  });

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token']; // Keep refresh token if needed for later
    // const expiresIn = data.body['expires_in']; // Less relevant now if not setting cookie maxAge

    console.log('[Callback Route] Access Token obtained:', accessToken ? 'Yes' : 'No');
    console.log('[Callback Route] Refresh Token obtained:', refreshToken ? 'Yes' : 'No');

    // Get User Info
    spotifyApi.setAccessToken(accessToken);
    const meData = await spotifyApi.getMe();
    const userName = meData.body.display_name || meData.body.id;
    console.log('[Callback Route] Successfully fetched user: ', userName);

    // Redirect to quiz page with success, user, accessToken, AND state
    const redirectUrl = new URL('/quiz', request.url);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('user', userName);
    redirectUrl.searchParams.set('state', state); // Pass state back
    redirectUrl.searchParams.set('access_token', accessToken); 
    const response = NextResponse.redirect(redirectUrl);
    
    // Optionally still set refresh token cookie if needed for future token refreshes
    if (refreshToken) {
        response.cookies.set('spotify_refresh_token_quiz', refreshToken, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // e.g., 30 days
        });
        console.log('[Callback Route] Set refresh_token cookie.');
    }

    // --- State/Token Cookie Deletion/Setting REMOVED ---
    // setCookiesOnResponse(response, cookiesToSet);
    // response.cookies.set('spotify_auth_state_quiz', '', { ... }); 

    return response;

  } catch (error: unknown) {
    let errorDetails = 'Unknown error during token exchange';
    const spotifyError = error as SpotifyError; // Type assertion

    if (spotifyError?.body?.error_description) {
        errorDetails = spotifyError.body.error_description;
    } else if (spotifyError?.message) {
        errorDetails = spotifyError.message;
    }
    
    console.error('Error getting tokens from Spotify:', error); // Log the full error
    return NextResponse.redirect(new URL(`/quiz?error=Token+Exchange+Failed&details=${encodeURIComponent(errorDetails)}`, request.url));
  }
} 