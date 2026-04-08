# this is the just in case song selection if there isnt any song submission or votes

const CLIENT_ID = "spotify ID"; #i'm gonna put it in later

const ACCESS_TOKEN = "access token"; # also put this later 

export const randomSong = async () => {
  try {
    const randomQueries = ["pop", "hip hop", "rock", "jazz", "indie"]:
    const query = randomQueries[Math.floor(Math.random() * randomQueries.length)];
    const response = await fetch(
      'https://api.spotify.com/v1/search?q=${query}&type=track&limit=20`,
      {
        headers : {
          Authorization : `Bearer ${ACCESS_TOKEN}`
        }
      }
    ):

  const data = await response.json();

  const tracks = data.tracks.item;

  const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
  return {
    title: randomTrack.name
    artists: randomTrack.artists[0].name,
    albumArt: randomTrack.album.images[0].url,
    duration: randomTrack.duration_ms / 1000,
    progress: 0,
    spotifyID:
  };

} catch (error) {
  console.error("Spotify fetch failed:", error);
  return null;
  }

};

# this just grabs a random song, it can be modified to pick specific songs like most popular 
# most likely its gonna need a safety feature implemented in
