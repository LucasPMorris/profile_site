import { ingestSpotifyPlays } from '../../services/spotifyIngestionService';

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method not allowed' }); }

  const token = req.headers['x-cron-token'];
  if (token !== process.env.X-CRON_SECRET) { return res.status(403).json({ message: 'Forbidden' }); }

  try {
    const startTime = Date.now();
    console.log('Starting Spotify play history ingestion: ', startTime);
    
    await ingestSpotifyPlays();
    const endTime = Date.now();
    console.log('Ingestion completed: ', endTime, 'Execution Time: ', endTime-startTime, 'ms');
    res.status(200).json({ success: true, duration, message: 'Ingestion completed successfully' });
  } catch (error) {
    console.error('Error during ingestion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}