import { db } from "./firebase"; //athen /confic 
import {doc, updateDoc, increment, getDoc} from "firebase/firestore";


const currentSongRef = doc(db, "playback", "current");

export const upvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, {
      upvotes: increment(1)
    });
  } catch (error) {
    console.error("Upvote failed:", error);
  }
};


export const downvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, {
      downvotes: increment(1)
    });
  } catch (error) {
    console.error("Downvote failed:", error);
  }
};

//reset votes 
export const resetVotes = async () => {
  try {
    await updateDoc(currentSongRef, {
      upvotes: 0,
      downvotes: 0
    });
  } catch (error) {
    console.error("Reset failed:", error);
  }
};

// calculates current vote
export const getVoteData = async () => {
  try {
    const snapshot = await getDoc(currentSongRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0
      };
    }
  } catch (error) {
    console.error("Get votes failed:", error);
  }

  return { upvotes: 0, downvotes: 0 };
};

  //TODO
  // add upvote and downvote button 
  //need to add it to display
  // add in prevent multiple users voting 
  //

