const CLIENT_ID = "47eb2e8b7c944819911b84566e9fc579";
const CLIENT_SECRET = "b5c6ec8188514fa6b2d80fd18d2b0edd";
const REFRESH_TOKEN = "AQAKqBWgtveYp49VeFZP-R-HslPdmZh33MvLIsUWERdILd5e47H8OuRnjCGDiNEa9AHbACFFBNW_aL-RmrFqbxTmFgnVsHZgSI1YeUQ7YqooZidfDJsrB78NLlcH6DNsMzg"

//OLD REFRESH TOKEN: "AQDR3Fi35jjvzh9j67IYsEcwX319EQs0PFG018874O8vyQE_KssEJnz2qvPsDn8em8CQs2Z531iakmhgf2OpECRfSwPlHbJ_vfAn7ijmQwjH1yfYYkA3UPcYjBn9Jhjyg6w";

//https://accounts.spotify.com/authorize?client_id=47eb2e8b7c944819911b84566e9fc579&response_type=code&redirect_uri=http://127.0.0.1:5173/callback&scope=user-read-currently-playing user-read-playback-state user-modify-playback-state



export async function getAccessToken() {

  const basic = btoa(CLIENT_ID + ":" + CLIENT_SECRET);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + basic,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN
    })
  });

  const data = await response.json();
  console.log("Token response:", data);

  return data.access_token;
}


export async function getCurrentlyPlaying() {
  const token = await getAccessToken();

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );

  // Nothing playing
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  console.log(data);

  // Spotify sometimes returns no item
  if (!data || !data.item) {
    return null;
  }

  return {
    title: data.item.name,
    artist: data.item.artists.map(a => a.name).join(", "),
    albumArt: data.item.album.images[0].url//,
    //releaseDate: data.item.release_date
  };
}


export async function searchTracks(query) {
  const token = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    {
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );

  const data = await response.json();

  return data.tracks.items.map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(", "),
    albumArt: track.album.images[0]?.url,
    uri: track.uri
  }));
}


export async function addToQueue(uri) {
  const token = await getAccessToken();

  await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );
}