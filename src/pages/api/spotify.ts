import type { NextApiRequest, NextApiResponse } from 'next';
import { getSpotifyStatsByDateRange } from '@/services/spotify';
import { SpotifyDataProps } from '@/common/types/spotify';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { start, end } = req.query;
    if (!start || !end) { return res.status(400).json({ error: 'Start and end dates are required' }); }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { return res.status(400).json({ error: 'Invalid date format' }); }

    console.log(`Fetching Spotify stats for ${start} to ${end}`);
    const startTime = Date.now();
    const data = await getSpotifyStatsByDateRange(new Date(start as string), new Date(end as string));
    const duration = Date.now() - startTime;
    console.log(`Spotify stats fetched in ${duration}ms`);

    // const unwrappedData = data.data;            // This little AI addition really messed me up!
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error in Spotify API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}