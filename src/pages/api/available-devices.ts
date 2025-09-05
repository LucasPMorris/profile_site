import { NextApiRequest, NextApiResponse } from 'next';
// TODO: Re-enable when Spotify data ingetion is complete.
// import { getAvailableDevices } from '@/services/spotify';

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
  // const response = await getAvailableDevices();

  // res.setHeader( 'Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30' );

  // return res.status(200).json(response?.data);
  return res.status(200).json({ devices: [] });
}
