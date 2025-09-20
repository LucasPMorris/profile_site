import express from 'express';
import next from 'next';
import { schedule } from 'node-cron'; 

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const domain = dev ? 'http://localhost:3000' : 'https://lucas.untethered4life.com';
  const historyurl = `${domain}/api/getspotifyhistory`;
  const dailyurl = `${domain}/api/aggregatedailystats`;

  console.log(`Cron job will POST to: ${historyurl} and ${dailyurl}`);
  console.log(`Running in ${dev ? 'development' : 'production'} mode`);
  let isRunning = false;

  async function runSpotifyIngestion() {
    try {
      const response = await fetch(historyurl, { method: 'POST', headers: { 'x-cron-token': process.env.CRON_SECRET } })
      const data = await response.json();
      
      if (!response.ok) { throw new Error(`HTTP ${response.status}: `, data); }
      console.log('✅ Scheduled spotify ingestion response:', data);
    
    } catch (error) { console.error('❌ Error in scheduled task:', error); }
  }

  async function aggregateDailyStats() {
    try {
      const response = await fetch(dailyurl, { method: 'POST', headers: { 'x-cron-token': process.env.CRON_SECRET } })
      const data = await response.json();
      
      if (!response.ok) { throw new Error(`HTTP ${response.status}: `, JSON.stringify(data)); }
      console.log('✅ Scheduled aggregate daily stats response:', data);
    
    } catch (error) { console.error('❌ Error in scheduled task:', error); }
  }

  if (!dev && process.env.CRON_ENABLED === 'true') {
    schedule('*/30 * * * *', async () => {
      if (isRunning) { console.warn(`⚠️ Skipping run — previous job still running`); return; }

      isRunning = true;
      
      console.log(`⏱️ Attempting data ingestion at ${new Date().toISOString()}`);
      try { await runSpotifyIngestion(); } finally { isRunning = false; }
    });

    schedule('10 */6 * * *', async () => {
      console.log(`⏱️ Attempting daily stats aggregation at ${new Date().toISOString()}`);
      await aggregateDailyStats();
    });
  } 

  server.all('*', (req, res) => { return handle(req, res); });
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on ${domain}`);
  });
}); 