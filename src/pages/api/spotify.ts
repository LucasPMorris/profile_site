import type { NextApiRequest, NextApiResponse } from 'next';
import { getSpotifyStatsByDateRange } from '@/services/spotify';
import { SpotifyDataProps } from '@/common/types/spotify';
import ConsoleOutput from '@/modules/playground/components/ConsoleOutput';

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

// export default async function handler( req: NextApiRequest, res: NextApiResponse ): Promise<void> {
//   try {
//     const dateNow = new Date();
//     const startDate = typeof req.query.start === 'string' ? new Date(req.query.start) : new Date(dateNow.getTime() - 30 * 24 * 60 * 60 * 1000);
//     const endDate = typeof req.query.end === 'string' ? new Date(req.query.end) : new Date();
    
//     if (!startDate || !endDate || Array.isArray(startDate) || Array.isArray(endDate)) { res.status(400).json({ message: 'Invalid or missing startDate or endDate parameters' }); return; }
    
//     const results = await getSpotifyStatsByDateRange(new Date(startDate), new Date(endDate));

//     if (results.status !== 200) { res.status(results.status).json({ message: 'Failed to fetch Spotify data' }); return; } 

//     const data: SpotifyDataProps = results.data;

//     res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=120' );

//     res.status(200).json(data);
//   } catch (error) {res.status(500).json({ message: 'Internal Server Error' }); }
// }

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
    // console.log('Data:', data);
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