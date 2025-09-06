import { NextApiRequest, NextApiResponse } from 'next';

import { getSpotifyStatsByDateRange } from '../../services/spotify';
import { SpotifyDataProps } from '@/common/types/spotify';

export default async function handler( req: NextApiRequest, res: NextApiResponse ): Promise<void> {
  try {
    const startDate = typeof req.query.start === 'string' ? new Date(req.query.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = typeof req.query.end === 'string' ? new Date(req.query.end) : new Date();
    
    if (!startDate || !endDate || Array.isArray(startDate) || Array.isArray(endDate)) { res.status(400).json({ message: 'Invalid or missing startDate or endDate parameters' }); return; }
    
    const results = await getSpotifyStatsByDateRange(new Date(startDate), new Date(endDate));

    if (results.status !== 200) { res.status(results.status).json({ message: 'Failed to fetch Spotify data' }); return; } 

    const data: SpotifyDataProps = results.data;

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=120' );

    res.status(200).json(data);
  } catch (error) {res.status(500).json({ message: 'Internal Server Error' }); }
}
