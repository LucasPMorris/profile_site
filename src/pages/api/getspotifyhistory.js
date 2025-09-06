import { ingestSpotifyPlays } from '../../services/spotifyIngestion';


export default async function handler(req, res) {
  console.log('API getspotifyhistory called, checking token...');

  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method not allowed' }); }

  const token = req.headers['x-cron-token'];
  if (token !== process.env.CRON_SECRET) { return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }); }

  console.log('Token valid, proceeding with ingestion...');

  try {
    const startTime = Date.now();
    console.log('Starting Spotify play history ingestion: ', startTime);
    
    await ingestSpotifyPlays();

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('Ingestion completed: ', endTime, 'Execution Time: ', duration, 'ms');
    
    res.status(200).json({ success: true, message: 'Ingestion completed successfully' });
  } catch (error) {
    console.error('Error during ingestion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}