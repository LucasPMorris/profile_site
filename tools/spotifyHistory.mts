async function startFetching(access_token: string) {
  const [recentlyPlayedData, topArtistData, topTrackData] = await Promise.all([
    fetchRecentlyPlayedData(access_token),
    fetchTopArtistData(access_token),
    fetchTopTrackData(access_token)
  ]);
  return { recentlyPlayedData, topArtistData, topTrackData };
}

async function writeFileToOutput(filename: string, data: any) {
  const fs = await import('fs');
  const path = await import('path');
  const outputDir = path.resolve(process.cwd());

  if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }
  fs.writeFileSync(path.join(outputDir, filename), data);
}

async function getAccessToken() {
  const TOKEN = Buffer.from(`4f34998e79e743ea93550fd3994f4040:bfb395c264ad4d3397c7b1cfce726f9c`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${TOKEN}` },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: 'AQAy0GNAyGa8MwH7tETcbp3S6XgW39Wo-VVhyU73mZ7prRoadvvppSsHbM3RLwhX844bUR7L0VBz2s7NLEnYlGhvn2PPeuphJ38knbKVn0iKxKPJqKFPGSryqXJ6P5Cy-yg' }).toString()
  });

  const data = await response.json();
  if (!response.ok) throw new Error('Failed to fetch access token');
  return data.access_token;
}

async function fetchRecentlyPlayedData(access_token: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', { headers: { Authorization: `Bearer ${access_token}` } });
  if (!response.ok) throw new Error('Failed to fetch Spotify data');

  const data = await response.json();
//  writeFileToOutput('recentlyPlayed.json', JSON.stringify(data, null, 2));
  return data;
}

async function fetchTopArtistData(access_token: string) {
  var allData = [];
  let url = 'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=long_term';

  while (url) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!response.ok) throw new Error('Failed to fetch Spotify data');

    const data = await response.json();
    allData = allData.concat(data.items);
    url = data.next;
  }

//  writeFileToOutput('topPlayedArtists.json', JSON.stringify(allData, null, 2));
  return allData;
}

async function fetchTopTrackData(access_token: string) {
  var allData = [];
  let url = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=long_term';

  while (url) {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` } });
    if (!response.ok) throw new Error('Failed to fetch Spotify data');

    const data = await response.json();
    allData = allData.concat(data.items);
    url = data.next;
  }

//  writeFileToOutput('topPlayedTracks.json', JSON.stringify(allData, null, 2));
  return allData;
}

var accessToken = await getAccessToken();
var spotifyData = await startFetching(accessToken);

export { };
