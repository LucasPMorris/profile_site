import fs from 'fs';
import path from 'path';
import prisma from '../common/libs/prisma.ts';
import { getArtistsByIds, getRecentlyPlayedFromSpotify } from './spotify.ts'; // your wrapper for the API call
import { RawRecentlyPlayedResponse } from '@/common/types/spotify.ts';


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

  for (const item of items as any[]) { // Using 'any' here because the raw structure from Spotify is not typed
    const { track, played_at } = item;

    const isrc = track.external_ids?.isrc;
    const albumArtistIds: string[] = track.album.artists.map((a: { id: string }) => a.id); // New after first run
    albumArtistIds.forEach(id => allArtistIds.add(id)); // New after first run
    track.artists.forEach((a: { id: string; }) => allArtistIds.add(a.id)); // New after first run

    await prisma.spalbum.upsert({
      where: { album_id: track.album.id },
      update: { name: track.album.name, image_url: track.album.images[0]?.url, release_date: new Date(track.album.release_date) },
      create: { album_id: track.album.id, name: track.album.name, image_url: track.album.images[0]?.url, release_date: new Date(track.album.release_date) }
    });

    for (const artist of track.album.artists) {
      await prisma.spartist.upsert({
        where: { artist_id: artist.id },
        update: { name: artist.name, artist_url: artist.external_urls.spotify },
        create: { artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify }
      });
      await prisma.spalbumartist.upsert({
        where: { album_id_artist_id: { album_id: track.album.id, artist_id: artist.id } },
        update: {},
        create: { album_id: track.album.id, artist_id: artist.id }
      });
    }

    // Upsert track
    await prisma.sptrack.upsert({
      where: { track_id: track.id },
      update: { title: track.name, isrc, album_id: track.album.id, explicit: track.explicit, song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000), release_date: new Date(track.album.release_date) },
      create: { track_id: track.id,
                title: track.name, 
                isrc: track.external_ids?.isrc,
                album_id: track.album.id,
                explicit: track.explicit,
                song_url: track.external_urls.spotify, duration: Math.floor(track.duration_ms / 1000),
                release_date: new Date(track.album.release_date) }
    } );

    // Upsert artists and track-artist relations
    for (const artist of track.artists) {
      await prisma.spartist.upsert({ 
        where: { artist_id: artist.id }, 
        update: { name: artist.name, artist_url: artist.external_urls.spotify },
        create: { artist_id: artist.id, name: artist.name, artist_url: artist.external_urls.spotify } });
      await prisma.sptrackartist.upsert({ 
        where: { track_id_artist_id: { track_id: track.id, artist_id: artist.id } }, 
        update: {}, 
        create: { track_id: track.id, artist_id: artist.id } } );
    }

    // Upsert play history
    await prisma.spplayhistory.upsert({ where: { track_id_played_at: { track_id: track.id, played_at: new Date(played_at) } }, update: {}, create: { track_id: track.id, played_at: new Date(played_at) } } );
  
  }

  console.log(`Ingested ${items.length} plays`);

  const enrichedArtists = await getArtistsByIds(Array.from(allArtistIds));
  for (const artist of enrichedArtists) {
    const image = artist.images?.find((image: { width: number }) => image.width === 160);
    await prisma.spartist.update({ where: { artist_id: artist.id }, data: { image_url: image?.url || null }});
  }

 if (!manualIngestion) await assignCommonAlbumUrls();
};
