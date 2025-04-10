# Personal Portfolio Website

This is the source code for my personal portfolio website, built with [Next.js](https://nextjs.org) and deployed on [Vercel](https://vercel.com).

It showcases my software projects and includes dynamic features like:
*   Recent Spotify listening activity (synced via Spotify Web API)
*   A player for personal music demos (synced from local folders)
*   A shoutbox for visitor messages (using Vercel KV — serverless Redis, powered by Upstash)
*   An image gallery

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
*   **Deployment:** [Vercel](https://vercel.com/)
*   **Database (Shoutbox):** [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (Redis)
*   **APIs:** [Spotify Web API](https://developer.spotify.com/documentation/web-api)
*   **Scripting:** Node.js

## Environment Variables

To run this project locally, particularly the custom scripts and features like the shoutbox, you need to create a `.env.local` file in the root directory and add the following environment variables:

```
# Spotify API Credentials (for syncing top tracks)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REFRESH_TOKEN=your_spotify_refresh_token

# Vercel KV Credentials (for Shoutbox)
KV_URL=your_vercel_kv_url
KV_REST_API_URL=your_vercel_kv_api_url
KV_REST_API_TOKEN=your_vercel_kv_api_token
KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token
```

Obtain Spotify credentials from the Spotify Developer Dashboard. Obtain Vercel KV credentials from your Vercel project settings after setting up a KV store.

## Custom Scripts

This project uses custom Node.js scripts (written in TypeScript) to fetch and prepare data:

*   `npm run sync-spotify`: Fetches top listening tracks from Spotify and saves them to `public/top-tracks.json`.
*   `npm run sync-demos`: Copies audio demo files from configured local directories into `public/audio/demos/` and creates `public/demos.json`.

**Important:** Run these scripts locally and commit the resulting JSON files and audio files before deploying to Vercel.

## Getting Started (Development)

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create and populate the `.env.local` file as described above.
4.  Run the development server:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/).

1.  Ensure your environment variables (Spotify, Vercel KV) are configured in your Vercel project settings.
2.  Push your code to your connected Git repository (GitHub, GitLab, etc.).
3.  Vercel will automatically build and deploy the site.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
