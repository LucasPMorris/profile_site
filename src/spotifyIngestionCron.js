import cron from 'node-cron';
import axios from 'axios';

const CRON_SECRET = process.env.CRON_SECRET;
const INGESTION_URL = 'https://lucas.untethered4life.com/api/cron-ingestion';

export function startSpotifyIngestionCron() {
  let isRunning = false;
  
  cron.schedule('0 * * * *', async () => { // Runs every hour
    if (isRunning) { console.log('⏰ Previous ingestion still running, skipping this run.'); return; }
    isRunning = true;

    console.log('⏰ Running scheduled Spotify ingestion...');
    try {
      const response = await axios.post(INGESTION_URL, {}, { headers: { 'x-cron-token': CRON_SECRET } });
      console.log(`✅ Ingestion response: ${response.data.message}`);
    } catch (error) { console.error('❌ Ingestion failed:', error.response?.data || error.message);
    } finally { console.log('⏰ Scheduled Spotify ingestion task completed.'); isRunning = false; }

  });
}