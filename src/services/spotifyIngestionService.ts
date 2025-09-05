import fs from 'fs';
import path from 'path';
import prisma from '../common/libs/prisma.ts';
import { getArtistsByIds, getRecentlyPlayedFromSpotify } from './spotify.ts'; // your wrapper for the API call
import { RawRecentlyPlayedResponse } from '@/common/types/spotify.ts';

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

const assignCommonAlbumUrls = async (dryRun = false): Promise<void> => {
  const tracks = await prisma.sptrack.findMany({ include: { album: { select: { album_id: true, name: true, image_url: true } }, plays: { select: { track_id: true, played_at: true } }} });

  const grouped = new Map<string, TrackVariantForSelection[]>();

  for (const track of tracks) {
    if (!grouped.has(track.isrc)) grouped.set(track.isrc, []);
    grouped.get(track.isrc)!.push(track);
  }

  const updates: { isrc: string; common_album_id: string }[] = [];

  for (const [isrc, variants] of grouped.entries()) {
    const selected = selectBestAlbumVariant(variants);
    updates.push({ isrc, common_album_id: selected.album.album_id });
    if (!dryRun) { await prisma.sptrack.updateMany({ where: { isrc }, data: { common_album_id: selected.album.album_id } }); }
  }

    if (dryRun) {
      writeFileForTest('commonAlbumAssignments.json', updates);
      console.log(`📝 Dry-run complete. Wrote ${updates.length} ISRC assignments to file.`);
    } else { console.log(`✅ Updated common_album_id for ${grouped.size} ISRCs`); }
};

export const ingestSpotifyPlays = async ( manualIngestion: boolean = false, _manualData: RawRecentlyPlayedResponse = { status: 200, data: [] }): Promise<void> => {
  const response = manualIngestion ? _manualData : await getRecentlyPlayedFromSpotify();

  if (response.status !== 200 || !response.data) {
    console.error('Failed to fetch recently played tracks from Spotify');
    console.error(`Error: Received status ${response.status} with no data.`);
    return;
  }

  const items = response.data;
  const allArtistIds = new Set<string>(); // New After first run

  const albumsToInsert: { album_id: string; name: string; image_url: string | null; release_date: Date }[] = [];
  const artistsToInsert: { artist_id: string; name: string; artist_url: string; }[] = [];
  const albumArtistJoins: { album_id: string; artist_id: string; }[] = [];
  const tracksToUpsert: { track_id: string; title: string; isrc: string | null; album_id: string; explicit: boolean; song_url: string | null; duration: number; release_date: Date; }[] = [];
  const trackArtistJoins: { track_id: string; artist_id: string; }[] = [];
  const playHistoryToInsert: { track_id: string; played_at: Date; }[] = [];

  for (const item of items as any[]) { // Using 'any' here because the raw structure from Spotify is not typed
    const { track, played_at } = item;
    const isrc = track.external_ids?.isrc;

    albumsToInsert.push({ album_id: track.album.id, name: track.album.name, image_url: track.album.images[0]?.url ?? null, release_date: new Date(track.album.release_date) });    
    track.album.artists.forEach((artist: any) => { artistsToInsert.push({ artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }); albumArtistJoins.push({ album_id: track.album.id, artist_id: artist.id }); });
    tracksToUpsert.push({ track_id: track.id, title: track.name, isrc, album_id: track.album.id, explicit: track.explicit, song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000), release_date: new Date(track.album.release_date) });
    track.artists.forEach((artist: any) => { artistsToInsert.push({ artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }); trackArtistJoins.push({ track_id: track.id, artist_id: artist.id }); });
    playHistoryToInsert.push({ track_id: track.id, played_at: new Date(played_at) });    
  }

  // Deduplicate
  const uniqueAlbums = dedupeById(albumsToInsert, 'album_id');
  const uniqueArtists = dedupeById(artistsToInsert, 'artist_id');
  const uniqueAlbumJoins = dedupeByComposite(albumArtistJoins, ['album_id', 'artist_id']);
  const uniqueTrackJoins = dedupeByComposite(trackArtistJoins, ['track_id', 'artist_id']);

  // Bulk insert
  await prisma.spalbum.createMany({ data: uniqueAlbums, skipDuplicates: true });
  await prisma.spartist.createMany({ data: uniqueArtists, skipDuplicates: true });
  await prisma.spalbumartist.createMany({ data: uniqueAlbumJoins, skipDuplicates: true });
  await prisma.spplayhistory.createMany({ data: playHistoryToInsert, skipDuplicates: true });
  await prisma.sptrack.createMany({ data: tracksToUpsert.map(({ isrc, ...rest }) => ({ ...rest, isrc: isrc ?? '' })), skipDuplicates: true });

  // Upsert tracks and joins (still needs per-item logic)
  for (const join of trackArtistJoins) { await prisma.sptrackartist.upsert({ where: { track_id_artist_id: { track_id: join.track_id, artist_id: join.artist_id } }, update: {}, create: join }); }
  for (const join of uniqueTrackJoins) { await prisma.sptrackartist.upsert({ where: { track_id_artist_id: join }, update: {}, create: join }); }

  console.log(`Ingested ${items.length} plays`);

  if (!manualIngestion) {
    const artistsToUpdate = await prisma.spartist.findMany({ where: { image_url: null }, select: { artist_id: true } });
    const idsToUpdate = new Set<string>(artistsToUpdate.map(a => a.artist_id));

    const enrichedArtists = await getArtistsByIds(Array.from(idsToUpdate));
    for (const artist of enrichedArtists) {
      const image = artist.images?.find((image: { width: number }) => image.width === 160);
      await prisma.spartist.update({ where: { artist_id: artist.id }, data: { image_url: image?.url || null }});
    }
    console.log(`🎨 Enriched ${enrichedArtists.length} artists with missing image_url`);
    await assignCommonAlbumUrls();
  } 
};
