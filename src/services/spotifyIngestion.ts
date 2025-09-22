'use server';
import fs from 'fs';
import path from 'path';
import prisma from '../common/libs/prisma.ts';
import { getArtistsByIds, getRecentlyPlayedFromSpotify } from './spotify.ts'; // your wrapper for the API call
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
  const trackCounts: Record<string, number> = {};
  const artistCounts: Record<string, number> = {};
  const trackHourlyMap = new Map<string, number[]>();
  const artistHourlyMap = new Map<string, number[]>();

  for (const play of plays) {
    const hour = new Date(play.played_at).getUTCHours();
    hourlyPlays[hour]++;

    const trackId = play.track_id;
    trackCounts[trackId] = (trackCounts[trackId] ?? 0) + 1;
    if (!trackHourlyMap.has(trackId)) trackHourlyMap.set(trackId, Array(24).fill(0));
    trackHourlyMap.get(trackId)![hour]++;

    for (const artist of play.track.track_artists) {
      const artistId = artist.artist_id;
      artistCounts[artistId] = (artistCounts[artistId] ?? 0) + 1;
      if (!artistHourlyMap.has(artistId)) artistHourlyMap.set(artistId, Array(24).fill(0));
      artistHourlyMap.get(artistId)![hour]++;
    }
  }

  // Create overall daily play stats
  await prisma.spdailyplaystats.create({ data: { date: start, weekday, hourly_plays: hourlyPlays } });

  console.log(`✅ Overall stats created for ${dateStr}`);

  // Resolve buckets
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + 1;
  const week = getISOWeek(start);

  const yearBucket = await prisma.yearbucket.findFirst({ where: { year } });
  const monthBucket = await prisma.monthbucket.findFirst({ where: { yearbucketid: yearBucket?.id, month } });
  const weekBucket = await prisma.weekbucket.findFirst({ where: { monthbucketid: monthBucket?.id, week } });

  const trackStats = Array.from(trackHourlyMap.entries()).map(([track_id, hourly_plays]) => ({ track_id, stat_date: start, count: hourly_plays.reduce((a, b) => a + b, 0), hourly_plays, bucket_scope: 'day' }) );
  
  const artistStats = Array.from(artistHourlyMap.entries()).map(([artist_id, hourly_plays]) => ({ artist_id, stat_date: start, count: hourly_plays.reduce((a, b) => a + b, 0), hourly_plays, bucket_scope: 'day' }));

  await prisma.trackstat.createMany({ data: trackStats, skipDuplicates: true });
  await prisma.artiststat.createMany({ data: artistStats, skipDuplicates: true });

  console.log(`📦 Bucketed counts updated for ${dateStr} → Y:${year} M:${month} W:${week}`);
};

// export const aggregateDailyStats = async (startDate: string, endDate: string) => {
//   try {
//     // Use raw SQL for better performance on large datasets
//     const dailyStats = await prisma.$queryRaw`
//       SELECT 
//         DATE(played_at) as play_date,
//         COUNT(*) as play_count,
//         COUNT(DISTINCT track_id) as unique_tracks,
//         COUNT(DISTINCT CASE WHEN st.explicit = true THEN st.track_id END) as explicit_count
//       FROM spplayhistory sph
//       JOIN sptrack st ON sph.track_id = st.track_id
//       WHERE played_at >= ${new Date(startDate)}
//         AND played_at <= ${new Date(endDate)}
//       GROUP BY DATE(played_at)
//       ORDER BY play_date DESC
//     `;

//     return dailyStats;
//   } catch (error) {
//     console.error('Error aggregating daily stats:', error);
//     throw error;
//   }
// };

// export const ingestSpotifyPlays = async ( manualIngestion: boolean = false, _manualData: RawRecentlyPlayedResponse = { status: 200, data: [] }): Promise<void> => {
//   const response = manualIngestion ? _manualData : await getRecentlyPlayedFromSpotify();

//   if (response.status !== 200 || !response.data) {
//     console.error('Failed to fetch recently played tracks from Spotify');
//     console.error(`Error: Received status ${response.status} with no data.`);
//     return;
//   }

//   const items = response.data;
//   const allArtistIds = new Set<string>(); // New After first run

//   const albumsToInsert: { album_id: string; name: string; image_url: string | null; release_date: Date }[] = [];
//   const artistsToInsert: { artist_id: string; name: string; artist_url: string; }[] = [];
//   const albumArtistJoins: { album_id: string; artist_id: string; }[] = [];
//   const tracksToUpsert: { track_id: string; title: string; isrc: string | null; album_id: string; explicit: boolean; song_url: string | null; duration: number; release_date: Date; }[] = [];
//   const trackArtistJoins: { track_id: string; artist_id: string; }[] = [];
//   const playHistoryToInsert: { track_id: string; played_at: Date; }[] = [];

//   for (const item of items as any[]) {
//     const { track, played_at } = item;
//     const isrc = track.external_ids?.isrc;

//     albumsToInsert.push({ album_id: track.album.id, name: track.album.name, image_url: track.album.images[0]?.url ?? null, release_date: new Date(track.album.release_date) });    
//     track.album.artists.forEach((artist: any) => { artistsToInsert.push({ artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }); albumArtistJoins.push({ album_id: track.album.id, artist_id: artist.id }); });
//     tracksToUpsert.push({ track_id: track.id, title: track.name, isrc, album_id: track.album.id, explicit: track.explicit, song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000), release_date: new Date(track.album.release_date) });
//     track.artists.forEach((artist: any) => { artistsToInsert.push({ artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }); trackArtistJoins.push({ track_id: track.id, artist_id: artist.id }); });
//     playHistoryToInsert.push({ track_id: track.id, played_at: new Date(played_at) });    
//   }

//   // Deduplicate
//   const uniqueAlbums = dedupeById(albumsToInsert, 'album_id');
//   const uniqueArtists = dedupeById(artistsToInsert, 'artist_id');
//   const uniqueAlbumJoins = dedupeByComposite(albumArtistJoins, ['album_id', 'artist_id']);
//   const uniqueTrackJoins = dedupeByComposite(trackArtistJoins, ['track_id', 'artist_id']);

//   // Bulk insert
//   await prisma.spalbum.createMany({ data: uniqueAlbums, skipDuplicates: true });
//   await prisma.spartist.createMany({ data: uniqueArtists, skipDuplicates: true });
//   await prisma.spalbumartist.createMany({ data: uniqueAlbumJoins, skipDuplicates: true });
//   await prisma.spplayhistory.createMany({ data: playHistoryToInsert, skipDuplicates: true });
//   await prisma.sptrack.createMany({ data: tracksToUpsert.map(({ isrc, ...rest }) => ({ ...rest, isrc: isrc ?? '' })), skipDuplicates: true });

//   // Upsert tracks and joins
//   for (const join of trackArtistJoins) { await prisma.sptrackartist.upsert({ where: { track_id_artist_id: { track_id: join.track_id, artist_id: join.artist_id } }, update: {}, create: join }); }
//   for (const join of uniqueTrackJoins) { await prisma.sptrackartist.upsert({ where: { track_id_artist_id: join }, update: {}, create: join }); }

//   console.log(`Ingested ${items.length} plays`);

//   if (!manualIngestion) {
//     const artistsToUpdate = await prisma.spartist.findMany({ where: { image_url: null }, select: { artist_id: true } });
//     const idsToUpdate = new Set<string>(artistsToUpdate.map(a => a.artist_id));

//     const enrichedArtists = await getArtistsByIds(Array.from(idsToUpdate));
//     for (const artist of enrichedArtists) {
//       const image = artist.images?.find((image: { width: number }) => image.width === 160);
//       await prisma.spartist.update({ where: { artist_id: artist.id }, data: { image_url: image?.url || null }});
//     }
//     console.log(`🎨 Enriched ${enrichedArtists.length} artists with missing image_url`);
//     await assignCommonAlbumUrls();
//   } 
// };

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
// export const updateBucketedStats = async (): Promise<void> => {
//   const startDate = new Date('2017-07-23'); // First Sunday before first play
//   const endDate = new Date(); // Today

//   let current = new Date(startDate);

//   while (current <= endDate) {
//     const year = current.getUTCFullYear();
//     const month = current.getUTCMonth() + 1;

//     const monthStart = new Date(Date.UTC(year, month - 1, 1));
//     const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

//     console.log(`📆 Processing ${year}-${month.toString().padStart(2, '0')}`);

//     const plays = await prisma.spplayhistory.findMany({
//       where: { played_at: { gte: monthStart, lte: monthEnd } },
//       include: { track: { include: { track_artists: true } } }
//     });

//     if (plays.length === 0) {
//       console.log(`🟡 No plays found for ${year}-${month}, skipping.`);
//       await sleep(10000);
//       current.setUTCMonth(current.getUTCMonth() + 1);
//       continue;
//     }

//     const buckets = {
//       year: new Map(),
//       month: new Map(),
//       week: new Map()
//     };

//     for (const play of plays) {
//       const date = new Date(play.played_at);
//       const y = date.getUTCFullYear();
//       const m = date.getUTCMonth() + 1;
//       const w = getISOWeek(date);

//       const yearKey = `${y}`;
//       const monthKey = `${y}-${m}`;
//       const weekKey = `${y}-W${w}`;

//       const trackId = play.track_id;
//       const artistIds = play.track.track_artists.map(a => a.artist_id);

//       for (const scope of ['year', 'month', 'week'] as const) {
//         const key = scope === 'year' ? yearKey : scope === 'month' ? monthKey : weekKey;
//         const bucket = buckets[scope];
//         if (!bucket.has(key)) {
//           bucket.set(key, { tracks: new Map(), artists: new Map() });
//         }

//         const stats = bucket.get(key)!;
//         stats.tracks.set(trackId, (stats.tracks.get(trackId) ?? 0) + 1);
//         for (const artistId of artistIds) {
//           stats.artists.set(artistId, (stats.artists.get(artistId) ?? 0) + 1);
//         }
//       }
//     }

//     for (const scope of ['year', 'month', 'week'] as const) {
//       const bucketMap = buckets[scope];
//       for (const [key, { tracks, artists }] of bucketMap.entries()) {
//         const [y, mOrW] = key.includes('W') ? key.split('-W') : key.split('-');
//         const yInt = parseInt(y);
//         const mInt = scope === 'month' || scope === 'week' ? parseInt(mOrW) : undefined;
//         const wInt = scope === 'week' ? parseInt(mOrW) : undefined;

//         const yearBucket = await prisma.yearbucket.findFirst({ where: { year: yInt } });
//         const monthBucket = scope !== 'year'
//           ? await prisma.monthbucket.findFirst({ where: { yearbucketid: yearBucket?.id, month: mInt } })
//           : undefined;
//         const weekBucket = scope === 'week'
//           ? await prisma.weekbucket.findFirst({ where: { monthbucketid: monthBucket?.id, week: wInt } })
//           : undefined;

//         const trackChunks: Prisma.trackstatCreateManyInput[][] =  chunk(Array.from(tracks.entries() as Iterable<[string, number]>).map(([track_id, count]: [string, number]) => (
//           { track_id, count, bucket_scope: scope, yearbucketid: yearBucket?.id, monthbucketid: monthBucket?.id, weekbucketid: weekBucket?.id } )), 200 );

//         const artistChunks: Prisma.artiststatCreateManyInput[][] =  chunk(Array.from(artists.entries() as Iterable<[string, number]>).map(([artist_id, count]: [string, number]) => (
//             { artist_id, count, bucket_scope: scope, yearbucketid: yearBucket?.id, monthbucketid: monthBucket?.id, weekbucketid: weekBucket?.id } )), 200 );

//         for (let i = 0; i < trackChunks.length; i++) {
//           await prisma.trackstat.createMany({ data: trackChunks[i], skipDuplicates: true });
//           console.log(`✅ ${key} track chunk ${i + 1} of ${trackChunks.length} inserted`);
//         }

//         for (let i = 0; i < artistChunks.length; i++) {
//           await prisma.artiststat.createMany({ data: artistChunks[i], skipDuplicates: true });
//           console.log(`✅ ${key} artist chunk ${i + 1} of ${artistChunks.length} inserted`);
//         }
//       }
//     }

//     await sleep(10000);
//     console.log(`🎧 Found ${plays.length} plays for ${year}-${month}`);
//     current.setUTCMonth(current.getUTCMonth() + 1);
//   }

//   console.log('🎉 Bucketed stats update complete');
// };

// export const backFillNoPlayDays = async (): Promise<void> => {
//   const firstPlay = await prisma.spplayhistory.findFirst({ orderBy: { played_at: 'asc' }, select: { played_at: true } });
//   if (!firstPlay) { console.error('No play history found.'); return; }

//   const start = new Date(firstPlay.played_at);
//   const end = new Date();

//   const everyDate: Date[] = [];
//   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) { 
//     const normalized = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
//     everyDate.push(normalized);
//    }

//   for (const date of everyDate) {
//     const existing = await prisma.spdailyplaystats.findUnique({ where: { date } });
//     if (existing) continue;

//     await prisma.spdailyplaystats.create({ data: { date, weekday: date.toLocaleDateString('en-US', { weekday: 'short' }), hourly_plays: Array(24).fill(0) } });

//     console.log(`🟦 Backfilled empty stats for ${date.toISOString().split('T')[0]}`);
//   } 
// }  

// export const updateDailyStats = async (): Promise<void> => {
//   const dates = await prisma.spplayhistory.findMany({ select: { played_at: true }, orderBy: { played_at: 'asc' } });
//   const uniqueDates = Array.from(new Set( dates.map(d => d.played_at.toISOString().split('T')[0]) ));

//   console.log(`Found ${uniqueDates.length} unique play dates from history.`);
//   const existingStats = await prisma.spdailyplaystats.findMany({ select: { date: true } });
//   const existingDates = new Set(existingStats.map(stat => stat.date.toISOString().split('T')[0]));
//   const filteredDates = uniqueDates.filter(date => !existingDates.has(date));
//   console.log(`Found ${filteredDates.length} new dates to process.`);
  
//   for (const dateStr of filteredDates) {
//     const start = new Date(`${dateStr}T00:00:00.000Z`);
//     const end = new Date(`${dateStr}T23:59:59.999Z`);

//     const plays = await prisma.spplayhistory.findMany({ where: { played_at: { gte: start, lte: end } }, include: { track: { include: { track_artists: true } } }});

//     const hourlyPlays = Array(24).fill(0);
//     const trackCounts: Record<string, number> = {};
//     const artistCounts: Record<string, number> = {};

//     for (const play of plays) {
//       console.log(`⏳ Normalizing stats for ${dateStr}`);
//       const hour = new Date(play.played_at).getHours();
//       hourlyPlays[hour]++;

//       const trackId = play.track_id;
//       trackCounts[trackId] = (trackCounts[trackId] ?? 0) + 1;

//       for (const artist of play.track.track_artists) { artistCounts[artist.artist_id] = (artistCounts[artist.artist_id] ?? 0) + 1; }
//     }

//     await prisma.spdailyplaystats.create({ data: { date: start,  weekday: start.toLocaleDateString('en-US', { weekday: 'short' }), hourly_plays: hourlyPlays } });

//     console.log(`✅ Normalized stats for ${dateStr}`);
//   }
// };

// function sleep(ms: number) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
