'use server';
import fs from 'fs';
import path from 'path';
import prisma from '../common/libs/prisma.ts';
import { getArtistsByIds, getRecentlyPlayedFromSpotify } from './spotify.ts'; // your wrapper for the API call
import { Prisma } from '@prisma/client';
import { RawRecentlyPlayedResponse } from '../common/types/spotify.ts';
import { getISOWeek } from 'date-fns';

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

function dedupeById<T extends { [key: string]: any }>(records: T[], key: keyof T): T[] {
  const seen = new Map<any, T>();
  for (const record of records) {
    if (!seen.has(record[key])) seen.set(record[key], record);
  }
  return Array.from(seen.values());
}

function dedupeByComposite<T>(records: T[], keys: (keyof T)[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const record of records) {
    const compositeKey = keys.map(k => record[k]).join('|');
    if (!seen.has(compositeKey)) { 
      seen.add(compositeKey);
      result.push(record);
    }
  }
  return result;
}

function writeFileForTest(filename: string, data: any): void {
  const filePath = path.resolve(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Wrote data to ${filePath}`);
}

type TrackVariantForSelection = {
  track_id: string; album_id: string; common_album_id: string | null; title: string; duration: number; release_date: Date | null; song_url: string | null;
  explicit: boolean; isrc: string; album: { album_id: string; name: string; image_url: string | null; }; plays: { track_id: string; played_at: Date; }[];
};

function selectBestAlbumVariant(variants: TrackVariantForSelection[]): TrackVariantForSelection {
  const single = variants.find(t => t.album.name.toLowerCase().includes('single'));
  return single ?? variants.reduce((a, b) => b.plays.length > a.plays.length ? b : a);
}

export const optimizedAssignCommonAlbumUrls = async (): Promise<void> => {
  try {
    // Single query to get all tracks with necessary data
    const tracks = await prisma.sptrack.findMany({ 
      select: { track_id: true, isrc: true, album_id: true, album: { select: { album_id: true, name: true, image_url: true } }, _count: { select: { plays: true } } }
    });

    // Group by ISRC in memory
    const isrcGroups = new Map<string, typeof tracks>();
    for (const track of tracks) {
      if (!track.isrc) continue;
      if (!isrcGroups.has(track.isrc)) { isrcGroups.set(track.isrc, []); }
      isrcGroups.get(track.isrc)!.push(track);
    }

    // Prepare batch updates
    const batchUpdates: Array<{ isrc: string; commonAlbumId: string }> = [];
    
    for (const [isrc, variants] of isrcGroups.entries()) {
      // Select best variant (prefer singles, then most played)
      const bestVariant = variants.reduce((best, current) => {
        // Prefer singles
        if (current.album.name.toLowerCase().includes('single') && !best.album.name.toLowerCase().includes('single')) { return current; }
        if (best.album.name.toLowerCase().includes('single') && !current.album.name.toLowerCase().includes('single')) { return best; }
        
        // If both or neither are singles, prefer most played
        return current._count.plays > best._count.plays ? current : best;
      });
      
      batchUpdates.push({ isrc, commonAlbumId: bestVariant.album_id });
    }

    // Batch update using transaction for better performance
    await prisma.$transaction( batchUpdates.map(update => prisma.sptrack.updateMany({ where: { isrc: update.isrc }, data: { common_album_id: update.commonAlbumId } }) ) );

//   for (const track of tracks) {
//     if (track.isrc) {
//         if (!grouped.has(track.isrc)) grouped.set(track.isrc, []);
//           grouped.get(track.isrc)!.push({...track, isrc: track.isrc ?? '', // Ensure isrc is a string
//             duration: track.duration ?? 0, // Ensure duration is a number
//         });
//     }

    console.log(`✅ Updated common_album_id for ${batchUpdates.length} ISRCs in batch`);
  } catch (error) {
    console.error('Error in optimized common album assignment:', error);
    throw error;
  }
};

// const assignCommonAlbumUrls = async (dryRun = false): Promise<void> => {
//   const tracks = await prisma.sptrack.findMany({ include: { album: { select: { album_id: true, name: true, image_url: true } }, plays: { select: { track_id: true, played_at: true } }} });

//   const grouped = new Map<string, TrackVariantForSelection[]>();

//   for (const track of tracks) {
//     if (!grouped.has(track.isrc)) grouped.set(track.isrc, []);
//     grouped.get(track.isrc)!.push(track);
//   }

//   const updates: { isrc: string; common_album_id: string }[] = [];

//   for (const [isrc, variants] of grouped.entries()) {
//     const selected = selectBestAlbumVariant(variants);
//     updates.push({ isrc, common_album_id: selected.album.album_id });
//     if (!dryRun) { await prisma.sptrack.updateMany({ where: { isrc }, data: { common_album_id: selected.album.album_id } }); }
//   }

//     if (dryRun) {
//       writeFileForTest('commonAlbumAssignments.json', updates);
//       console.log(`📝 Dry-run complete. Wrote ${updates.length} ISRC assignments to file.`);
//     } else { console.log(`✅ Updated common_album_id for ${grouped.size} ISRCs`); }
// };

// export const aggregateDailyStats = async (targetDate: Date): Promise<void> => {
//   const dateStr = targetDate.toISOString().split('T')[0];
//   const start = new Date(`${dateStr}T00:00:00.000Z`);
//   const end = new Date(`${dateStr}T23:59:59.999Z`);

//   // Delete existing stats and update
//   await prisma.spdailyplaystats.deleteMany({ where: { date: start } });

//   // Run your aggregation logic here
//   const plays = await prisma.spplayhistory.findMany({ where: { played_at: { gte: start, lte: end } }, include: { track: { include: { track_artists: true } } } });
  
//   const hourlyPlays = Array(24).fill(0);
//   const trackCounts: Record<string, number> = {};
//   const artistCounts: Record<string, number> = {};

//   for (const play of plays) {
//     const hour = new Date(play.played_at).getUTCHours();
//     hourlyPlays[hour]++;

//     const trackId = play.track_id;
//     trackCounts[trackId] = (trackCounts[trackId] ?? 0) + 1;

//     for (const artist of play.track.track_artists) { artistCounts[artist.artist_id] = (artistCounts[artist.artist_id] ?? 0) + 1; }
//   }

//   const topTracks = Object.entries(trackCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([track_id, count]) => ({ track_id, count }));
//   const topArtists = Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([artist_id, count]) => ({ artist_id, count }));

//   await prisma.spdailyplaystats.create({ data: { date: start, weekday: start.toLocaleDateString('en-US', { weekday: 'short' }), hourly_plays: hourlyPlays, top_tracks: { create: topTracks }, top_artists: { create: topArtists } } });

//   console.log(`✅ Stats created for ${dateStr}`);

//   const year = start.getUTCFullYear();
//   const month = start.getUTCMonth() + 1;
//   const week = getISOWeek(start);

//   const yearBucket = await prisma.yearbucket.findFirst({ where: { year } });
//   const monthBucket = await prisma.monthbucket.findFirst({ where: { yearbucketid: yearBucket?.id, month } });
//   const weekBucket = await prisma.weekbucket.findFirst({ where: { monthbucketid: monthBucket?.id, week } });

//   const trackStats = Object.entries(trackCounts).map(([track_id, count]) => ({ track_id, count, bucket_scope: 'day', yearbucketid: yearBucket?.id, monthbucketid: monthBucket?.id, weekbucketid: weekBucket?.id }));
//   const artistStats = Object.entries(artistCounts).map(([artist_id, count]) => ({ artist_id, count, bucket_scope: 'day', yearbucketid: yearBucket?.id, monthbucketid: monthBucket?.id, weekbucketid: weekBucket?.id }));

//   await prisma.trackstat.createMany({ data: trackStats, skipDuplicates: true });
//   await prisma.artiststat.createMany({ data: artistStats, skipDuplicates: true });

//   console.log(`📦 Bucketed stats updated for ${dateStr} → Y:${year} M:${month} W:${week}`);  
// };

export const aggregateDailyStats = async (targetDate: Date): Promise<void> => {
  const dateStr = targetDate.toISOString().split('T')[0];
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  const weekday = start.toLocaleDateString('en-US', { weekday: 'short' });

  // Delete existing daily play stats
  await prisma.spdailyplaystats.deleteMany({ where: { date: start } });

  // Fetch play history with track and artist info
  const plays = await prisma.spplayhistory.findMany({
    where: { played_at: { gte: start, lte: end } },
    include: { track: { include: { track_artists: true } } }
  });

  const hourlyPlays = Array(24).fill(0);
  const trackCounts = new Map<string, number>();
  const artistCounts = new Map<string, number>();
  const trackHourlyMap = new Map<string, number[]>();
  const artistHourlyMap = new Map<string, number[]>();

  for (const play of plays) {
    const hour = new Date(play.played_at).getUTCHours();
    hourlyPlays[hour]++;

    const trackId = play.track_id;
    trackCounts.set(trackId, (trackCounts.get(trackId) || 0) + 1);
    if (!trackHourlyMap.has(trackId)) trackHourlyMap.set(trackId, Array(24).fill(0));
    trackHourlyMap.get(trackId)![hour]++;

    for (const artist of play.track.track_artists) {
      const artistId = artist.artist_id;
      artistCounts.set(artistId, (artistCounts.get(artistId) || 0) + 1);
      if (!artistHourlyMap.has(artistId)) artistHourlyMap.set(artistId, Array(24).fill(0));
      artistHourlyMap.get(artistId)![hour]++;
    }
  }

  // Create overall daily play stats
  await prisma.spdailyplaystats.create({ data: { date: start, weekday, hourly_plays: hourlyPlays } });

  console.log(`✅ Overall stats created for ${dateStr}`);

  // Find existing day bucket (daybuckets are pre-created up to 2030)
  const dayBucket = await prisma.daybucket.findFirst({
    where: { start_date: start }
  });

  if (!dayBucket) {
    throw new Error(`Day bucket not found for ${dateStr}. Daybuckets should be pre-created up to 2030.`);
  }

  // Create stats using individual upserts (matching updateBucketedStats approach)
  for (const [artist_id, count] of artistCounts.entries()) {
    await prisma.artiststat.upsert({
      where: { artist_id_stat_date: { artist_id, stat_date: start } },
      update: { 
        count, 
        hourly_plays: artistHourlyMap.get(artist_id), 
        daybucketid: dayBucket.id, 
        bucket_scope: 'day' 
      },
      create: { 
        artist_id, 
        count, 
        hourly_plays: artistHourlyMap.get(artist_id), 
        stat_date: start, 
        daybucketid: dayBucket.id, 
        bucket_scope: 'day' 
      }
    });
  }

  for (const [track_id, count] of trackCounts.entries()) {
    await prisma.trackstat.upsert({
      where: { track_id_stat_date: { track_id, stat_date: start } },
      update: { 
        count, 
        hourly_plays: trackHourlyMap.get(track_id), 
        daybucketid: dayBucket.id, 
        bucket_scope: 'day' 
      },
      create: { 
        track_id, 
        count, 
        hourly_plays: trackHourlyMap.get(track_id), 
        stat_date: start, 
        daybucketid: dayBucket.id, 
        bucket_scope: 'day' 
      }
    });
  }

  console.log(`📦 Bucketed stats updated for ${dateStr} (daybucket: ${dayBucket.id})`);
};

export const ingestSpotifyPlays = async (): Promise<void> => {
  const response = await getRecentlyPlayedFromSpotify();

  if (response.status !== 200 || !response.data) {
    console.error('Failed to fetch recently played tracks from Spotify');
    return;
  }

  const items = response.data;
  console.log(`Processing ${items.length} plays`);

  // Prepare batch operations
  const albumUpserts: any[] = [];
  const trackUpserts: any[] = [];
  const artistUpserts: any[] = [];
  const playHistoryUpserts: any[] = [];
  const trackArtistRelations: any[] = [];
  const albumArtistRelations: any[] = [];

  // Collect all unique entities
  const allArtistIds = new Set<string>();

  for (const item of items as any[]) {
    const { track, played_at } = item;
    const isrc = track.external_ids?.isrc;

    // Collect album data
    albumUpserts.push({
      where: { album_id: track.album.id },
      update: { name: track.album.name, image_url: track.album.images[0]?.url, release_date: new Date(track.album.release_date) },
      create: {  album_id: track.album.id, name: track.album.name, image_url: track.album.images[0]?.url, release_date: new Date(track.album.release_date) }
    });

    // Collect track data
    trackUpserts.push({
      where: { track_id: track.id },
      update: { title: track.name, isrc, album_id: track.album.id, explicit: track.explicit, song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000), release_date: new Date(track.album.release_date)  },
      create: { track_id: track.id, title: track.name, isrc, album_id: track.album.id, explicit: track.explicit, song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000), release_date: new Date(track.album.release_date) }
    });

    // Collect artist data and relationships
    for (const artist of [...track.artists, ...track.album.artists]) {
      allArtistIds.add(artist.id);
      
      artistUpserts.push({
        where: { artist_id: artist.id },
        update: { name: artist.name, artist_url: artist.external_urls.spotify },
        create: { artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }
      });
    }

    // Collect track-artist relationships
    for (const artist of track.artists) {
      trackArtistRelations.push({
        where: { track_id_artist_id: { track_id: track.id, artist_id: artist.id } }, update: {},
        create: { track_id: track.id, artist_id: artist.id }
      });
    }

    // Collect album-artist relationships
    for (const artist of track.album.artists) {
      albumArtistRelations.push({
        where: { album_id_artist_id: { album_id: track.album.id, artist_id: artist.id } }, update: {},
        create: { album_id: track.album.id, artist_id: artist.id }
      });
    }

    // Collect play history
    playHistoryUpserts.push({
      where: { track_id_played_at: { track_id: track.id, played_at: new Date(played_at) } }, update: {},
      create: { track_id: track.id, played_at: new Date(played_at) }
    });
  }

  // Execute all operations in a transaction for better performance
  await prisma.$transaction(async (tx) => {
    const batchSize = 50;
    
    // Albums
    for (let i = 0; i < albumUpserts.length; i += batchSize) {
      const batch = albumUpserts.slice(i, i + batchSize);
      await Promise.all(batch.map(op => tx.spalbum.upsert(op)));
    }

    // Artists
    for (let i = 0; i < artistUpserts.length; i += batchSize) {
      const batch = artistUpserts.slice(i, i + batchSize);
      await Promise.all(batch.map(op => tx.spartist.upsert(op)));
    }

    // Tracks
    for (let i = 0; i < trackUpserts.length; i += batchSize) {
      const batch = trackUpserts.slice(i, i + batchSize);
      await Promise.all(batch.map(op => tx.sptrack.upsert(op)));
    }

    // Relationships and play history
    await Promise.all([
      ...trackArtistRelations.map(op => tx.sptrackartist.upsert(op)),
      ...albumArtistRelations.map(op => tx.spalbumartist.upsert(op)),
      ...playHistoryUpserts.map(op => tx.spplayhistory.upsert(op))
    ]);
  });

  // Fetch artist images and update common albums
  await Promise.all([
    updateArtistImages(Array.from(allArtistIds)),
    optimizedAssignCommonAlbumUrls()
  ]);

  console.log(`✅ Ingested ${items.length} plays successfully`);
};

async function updateArtistImages(artistIds: string[]) {
  if (artistIds.length === 0) return;
  
  const enrichedArtists = await getArtistsByIds(artistIds);  
  const updates = enrichedArtists.map(artist => {
    const image = artist.images?.find((img: { width: number }) => img.width === 160);
    return prisma.spartist.update({ where: { artist_id: artist.id }, data: { image_url: image?.url || null } });
  });

  await Promise.all(updates);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
