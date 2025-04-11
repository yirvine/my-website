import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define interfaces for the Spotify API response shapes
interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

interface SpotifyArtist {
  name: string;
  id: string; // Add other fields if needed
}

interface SpotifyAlbum {
  images?: SpotifyImage[];
  name: string; // Add other fields if needed
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  // Add other fields like popularity, preview_url if needed
}

interface SpotifyTopTracksResponse {
  items: SpotifyTrackItem[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function GET(request: NextRequest) {
  // Read token from Authorization header
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.split(' ')?.[1]; // Extract token after 'Bearer '

  if (!accessToken) {
    console.error('[API /quiz/top-tracks] Missing Authorization header or token');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('[API /quiz/top-tracks] Access token found in header, fetching top tracks...');

  try {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks?limit=20&time_range=medium_term`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Handle cases where response body is not JSON
        errorData = { error: 'Failed to parse error response from Spotify' };
      }

      console.error('[API /quiz/top-tracks] Spotify API Error:', response.status, errorData);

      if (response.status === 401) {
        // Return 401, no need to clear cookies here anymore
        return NextResponse.json(
          { error: 'Spotify token expired or invalid.', details: errorData },
          { status: 401 }
        );
      }
      return NextResponse.json({ error: 'Failed to fetch top tracks from Spotify', details: errorData }, { status: response.status });
    }

    // Add type assertion for the parsed data
    const data: SpotifyTopTracksResponse = await response.json();
    console.log(`[API /quiz/top-tracks] Successfully fetched ${data.items?.length || 0} tracks.`);

    // Use the defined types in the map function
    const tracks = data.items.map((item: SpotifyTrackItem) => ({
      id: item.id,
      name: item.name,
      artists: item.artists.map((artist: SpotifyArtist) => artist.name).join(', '),
      albumImageUrl: item.album.images?.[0]?.url,
    }));

    return NextResponse.json({ tracks });

  } catch (error) {
    console.error('[API /quiz/top-tracks] Internal Server Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error while fetching top tracks', details: errorMessage }, { status: 500 });
  }
} 