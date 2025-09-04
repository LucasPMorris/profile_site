import { NextApiRequest, NextApiResponse } from 'next';

import { getTopArtists, getTopTracks, getRecentlyPlayed, getTopArtistsFromDB, getTopTracksFromDB, getRecentlyPlayedFromDB } from '../../services/spotify';

export default async function handler( req: NextApiRequest, res: NextApiResponse ): Promise<void> {
  try {
    const results = await Promise.allSettled([
      getTopArtistsFromDB(),    
      getTopTracksFromDB(),
      getRecentlyPlayedFromDB()
    ]);

    const [topArtists, topTracks, recentlyPlayed] = results;

    if (topArtists.status === 'rejected') { console.error('Top Artists fetch failed:', topArtists.reason); }
    if (topTracks.status === 'rejected') { console.error('Top Tracks fetch failed:', topTracks.reason); }
    if (recentlyPlayed.status === 'rejected') { console.error('Recently Played fetch failed:', recentlyPlayed.reason); }

    const data = {
      topArtists: topArtists.status === 'fulfilled' ? topArtists.value.data : [],
      topTracks: topTracks.status === 'fulfilled' ? topTracks.value.data : [],
      recentlyPlayed: recentlyPlayed.status === 'fulfilled' ? recentlyPlayed.value.data : [],
    };

    // Cache for 1 hour, revalidate for 30 seconds
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=120' );

    res.status(200).json(data);
  } catch (error) {res.status(500).json({ message: 'Internal Server Error' }); }
}
