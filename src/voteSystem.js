import { db } from "./firebase";
import {
  doc, updateDoc, increment, getDoc, setDoc, onSnapshot, collection, serverTimestamp
} from "firebase/firestore";

/**
 * Vote on the currently playing song.
 * - One vote per user per song (keyed by userId + spotifyTrackId).
 * - Updates the playback/current doc's upvotes/downvotes counters.
 * - Returns { success, reason } so the UI can show feedback.
 */
export const voteOnCurrentSong = async (userId, voteType, trackId) => {
  if (!userId || !trackId) return { success: false, reason: "missing_data" };

  const voteDocId = `${userId}_${trackId}`;
  const voteRef   = doc(db, "votes", voteDocId);
  const songRef   = doc(db, "playback", "current");

  try {
    // Check if user already voted on THIS song
    const existing = await getDoc(voteRef);
    if (existing.exists()) {
      return { success: false, reason: "already_voted" };
    }

    // Record the vote
    await setDoc(voteRef, {
      userId,
      trackId,
      voteType,          // "up" | "down"
      timestamp: serverTimestamp(),
    });

    // Increment counter on the current song doc
    const field = voteType === "up" ? "upvotes" : "downvotes";
    await updateDoc(songRef, { [field]: increment(1) });

    return { success: true };
  } catch (e) {
    console.error("Vote failed:", e);
    return { success: false, reason: "error" };
  }
};

/**
 * Check if a user has already voted on a specific track.
 * Returns null (no vote) or "up"/"down".
 */
export const getUserVoteForTrack = async (userId, trackId) => {
  if (!userId || !trackId) return null;
  try {
    const snap = await getDoc(doc(db, "votes", `${userId}_${trackId}`));
    return snap.exists() ? snap.data().voteType : null;
  } catch {
    return null;
  }
};

/**
 * Subscribe to live vote counts for the current song.
 * Calls callback({ upvotes, downvotes }) whenever they change.
 * Returns the unsubscribe function.
 */
export const subscribeToVotes = (callback) => {
  const songRef = doc(db, "playback", "current");
  return onSnapshot(songRef, (snap) => {
    if (snap.exists()) {
      const { upvotes = 0, downvotes = 0 } = snap.data();
      callback({ upvotes, downvotes });
    } else {
      callback({ upvotes: 0, downvotes: 0 });
    }
  });
};

/**
 * Reset votes on the current song doc (call this when a new song starts).
 * Typically invoked by your Cloud Function when the track changes.
 */
export const resetCurrentSongVotes = async () => {
  try {
    await updateDoc(doc(db, "playback", "current"), { upvotes: 0, downvotes: 0 });
  } catch (e) {
    console.error("Reset failed:", e);
  }
};
