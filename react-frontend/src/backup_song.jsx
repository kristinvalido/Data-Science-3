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
  
# this is so it doesn't pick any explicit songs
  const data = await response.json();
    
  if (!data.tracks || !data.tracks.item) return null;
    const cleanTracks = data.tracks.item.filter(
      (track) => track.explicit == false
      );

    if (cleanTracks.length ===0) {
      console.warn("No clean tracks found, retrying...");
      return getRandomSong();
    }
    

  const randomTrack = cleanTracks[Math.floor(Math.random() * cleanTracks.length)];
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
