import { startSpotifyIngestionCron } from '../cron/spotifyIngestionCron';

export function startCronJobs() {
  if (process.env.NODE_ENV === 'production') {
    startSpotifyIngestionCron();
  }
}