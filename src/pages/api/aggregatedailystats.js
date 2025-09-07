import { aggregateDailyStats } from '../../services/spotifyIngestion';


export default async function handler(req, res) {
  console.log('API aggregatedailystats called, checking token...');

  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method not allowed' }); }

  const token = req.headers['x-cron-token'];
  if (token !== process.env.CRON_SECRET) { return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }); }

  console.log('Token valid, proceeding with ingestion...');

  try {
    const startTime = new Date();
    console.log('Starting daily stats ingestion: ', startTime);
    const daysToAggregate = [0, -1, -2]; // today and yesterday

    for (const offset of daysToAggregate) {
      const target = new Date(Date.UTC(
        startTime.getUTCFullYear(),
        startTime.getUTCMonth(),
        startTime.getUTCDate() + offset
      ));    
      await aggregateDailyStats(target);
    }

    const endTime = Date();
    const duration = endTime - startTime;
    console.log('Daily stats ingestion completed: ', endTime, 'Execution Time: ', duration, 'ms');
    
    res.status(200).json({ success: true, message: 'Daily stats ingestion completed successfully' });
  } catch (error) {
    console.error('Error during daily stats ingestion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}