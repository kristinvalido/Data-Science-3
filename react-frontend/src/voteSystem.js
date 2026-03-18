import { db } from "./firebase";
import { doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";

const currentSongRef = doc(db, "playback", "current");

export const upvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, { upvotes: increment(1) });
  } catch (error) {
    console.error("Upvote failed:", error);
  }
};

export const downvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, { downvotes: increment(1) });
  } catch (error) {
    console.error("Downvote failed:", error);
  }
};

export const resetVotes = async () => {
  try {
    await updateDoc(currentSongRef, { upvotes: 0, downvotes: 0 });
  } catch (error) {
    console.error("Reset failed:", error);
  }
};

export const getVoteData = async () => {
  try {
    const snapshot = await getDoc(currentSongRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return { upvotes: data.upvotes || 0, downvotes: data.downvotes || 0 };
    }
  } catch (error) {
    console.error("Get votes failed:", error);
  }
  return { upvotes: 0, downvotes: 0 };
};

export const trackUserVoting = async (userId, voteType) => {
  try {
    const voteRef = doc(db, "votes", `${userId}_current`);
    const existingVote = await getDoc(voteRef);
    if (existingVote.exists()) {
      console.log("You already voted.");
      return false;
    }
    await setDoc(voteRef, { userId, voteType, timestamp: new Date() });
    if (voteType === "up") {
      await updateDoc(currentSongRef, { upvotes: increment(1) });
    } else {
      await updateDoc(currentSongRef, { downvotes: increment(1) });
    }
    return true;
  } catch (error) {
    console.error("Vote failed:", error);
    return false;
  }
};