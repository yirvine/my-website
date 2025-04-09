// scripts/sync-spotify-top-tracks.ts
import { Buffer } from 'buffer'; // Needed for base64 encoding
import path from 'path';
import { promises as fs } from 'fs';

// --- Configuration ---
// Read credentials from environment variables
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN; // You will need to add this!

const jsonOutputFile = path.join(__dirname, '../../public/top-tracks.json'); // Note: __dirname points to dist/scripts after compilation
const timeRange = 'medium_term'; // Options: short_term (~4 weeks), medium_term (~6 months), long_term (~years)
const limit = 10; // Number of tracks to fetch
// --- End Configuration ---

// Helper function to get Access Token using Refresh Token
async function getAccessToken() {
    console.log('Attempting to get Spotify access token...');
    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials in environment variables (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)');
    }
     if (!refreshToken) {
        // This error will occur until the user adds the refresh token
        throw new Error('Missing Spotify refresh token in environment variables (SPOTIFY_REFRESH_TOKEN). Please generate one and add it.');
     }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
        // Add cache: 'no-store' to potentially help avoid caching issues during build
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Spotify Token API Response Error Body:", errorBody);
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
     if (!data.access_token) {
         console.error("Spotify Token API Response Data:", data);
         throw new Error('Access token not found in Spotify response.');
     }
     console.log('Successfully obtained Spotify access token.');
    return data.access_token;
}

// Helper function to get Top Tracks
async function getTopTracks(accessToken: string) {
    console.log(`Fetching top ${limit} tracks (time range: ${timeRange})...`);
    const url = `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        // Add cache: 'no-store'
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorBody = await response.text();
         console.error("Spotify Top Tracks API Response Error Body:", errorBody);
        throw new Error(`Failed to get top tracks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || []; // Return items array or empty if none
}

// Main sync function
async function syncTopTracks() {
    console.log('Starting Spotify top tracks sync...');

    try {
        const accessToken = await getAccessToken();
        const topTracksRaw = await getTopTracks(accessToken);
        console.log(`Fetched ${topTracksRaw.length} top tracks.`);

        // Process tracks for cleaner data structure
        const processedTracks = topTracksRaw.map((track: any) => ({
            id: track.id,
            name: track.name,
            artists: track.artists.map((artist: any) => artist.name).join(', '),
            // Find the image closest to 64px (smallest usually), default to first image
            albumImageUrl: track.album?.images?.reduce((prev: any, curr: any) => {
                return (Math.abs(curr.width - 64) < Math.abs(prev.width - 64) ? curr : prev);
            }, track.album?.images?.[0])?.url || undefined,
            trackUrl: track.external_urls?.spotify,
            popularity: track.popularity,
        }));

        // Ensure target directory exists (needed because __dirname points to dist/scripts)
        const outputDir = path.dirname(jsonOutputFile);
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (mkdirErr) {
            // Ignore EEXIST error if directory already exists
            if ((mkdirErr as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw mkdirErr;
            }
        }

        // Write data to JSON file
        await fs.writeFile(jsonOutputFile, JSON.stringify(processedTracks, null, 2));
        console.log(`Successfully wrote top tracks data to ${jsonOutputFile}`);

    } catch (error) {
        const err = error as Error;
        console.error('------------------------------------------');
        console.error('Error during Spotify top tracks sync:', err.message);
        // More detailed logging for debugging
        if (err.stack) {
             console.error(err.stack);
        }
        console.error('------------------------------------------');

        // Create an empty file to prevent 404s on the page, but log failure
        console.warn('Creating empty top-tracks.json due to sync error. Build will continue.');
         try {
            const outputDir = path.dirname(jsonOutputFile);
             try {
                 await fs.mkdir(outputDir, { recursive: true });
             } catch (mkdirErr) {
                  if ((mkdirErr as NodeJS.ErrnoException).code !== 'EEXIST') {
                      throw mkdirErr;
                  }
             }
            await fs.writeFile(jsonOutputFile, JSON.stringify([], null, 2));
         } catch (writeErr) {
            console.error("Failed to write empty top-tracks.json:", (writeErr as Error).message);
         }
         // Do not exit - allow build to continue but signal issue in logs
    }
}

syncTopTracks(); 