import { db } from "./firebase";
import {
  doc, updateDoc, increment, getDoc, setDoc, onSnapshot, collection, serverTimestamp
} from "firebase/firestore";

/**
 * Upvote a song in the pending queue.
 * One vote per user per song (keyed by userId + songId).
 */
export const upvoteSong = async (userId, songId) => {
  if (!userId || !songId) return { success: false, reason: "missing_data" };

  const voteRef = doc(db, "votes", `${userId}_${songId}`);
  const songRef = doc(db, "submittedSongs", songId);

  try {
    const existing = await getDoc(voteRef);
    if (existing.exists()) return { success: false, reason: "already_voted" };

    await setDoc(voteRef, {
      userId,
      trackId: songId,
      voteType: "up",
      timestamp: serverTimestamp(),
    });

    await updateDoc(songRef, { votes: increment(1) });

    return { success: true };
  } catch (e) {
    console.error("Upvote failed:", e);
    return { success: false, reason: "error" };
  }
};