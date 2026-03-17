import { useState } from "react";
import { searchTracks, addToQueue } from "./spotify";

function SongSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query) return;

    const tracks = await searchTracks(query);
    setResults(tracks);
  };

  const handleAdd = async (uri) => {
    await addToQueue(uri);
    alert("Added to queue!");
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Search Songs</h2>

      <input
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "10px", width: "250px" }}
      />

      <button onClick={handleSearch} style={{ marginLeft: "10px" }}>
        Search
      </button>

      <div style={{ marginTop: "20px" }}>
        {results.map((track) => (
          <div key={track.id} style={{ marginBottom: "15px" }}>
            <img src={track.albumArt} width="50" />
            <span style={{ marginLeft: "10px" }}>
              {track.title} - {track.artist}
            </span>
            <button
              onClick={() => handleAdd(track.uri)}
              style={{ marginLeft: "10px" }}
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SongSearch;