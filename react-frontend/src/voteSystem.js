import { db } from "./firebase"; //athen /confic 
import {doc, updateDoc, increment, getDoc, setDoc} from "firebase/firestore";


const currentSongRef = doc(db, "playback", "current");

export const upvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, {
      upvotes: increment(1)
    });
  } 
  catch (error) {
    console.error("Upvote failed:", error);
  }
};


export const downvoteSong = async () => {
  try {
    await updateDoc(currentSongRef, {
      downvotes: increment(1)
    });
  } 
  catch (error) {
    console.error("Downvote failed:", error);
  }
};

//reset votes 
export const resetVotes = async () => {
  try {
    await updateDoc(currentSongRef, {upvotes: 0, downvotes: 0});
  } 
  catch (error) {
    console.error("Reset failed:", error);
  }
};

// calculates current vote
export const getVoteData = async () => {
  try {
    const snapshot = await getDoc(currentSongRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return { upvotes: data.upvotes || 0, downvotes: data.downvotes || 0};
    }
  } 
  catch (error) {
    console.error("Get votes failed:", error);
  }

  return { upvotes: 0, downvotes: 0 };

  //need to limit miltple voting, tracked with Id
  explort const trackUserVoting = async (userId, voteType) => {
    try {
      const voteRef = doc(db, "votes", `${userId}_current`);
      const existingVoter = await getDoc(voteRef);

      if (exsitingVoter.exists()) {
        console.log("You already votes.");
        return
      }
      await setDoc(voteRef, {userId, voteType, timestamp: new Date()}); // saves users vote

      if (voteType == "up") {
        await updateDoc(currentSongRef, {
          upvotes : increment(1)
        });
      } 
      else {
        await updateDoc(currentSongRef, {
          downvotes: increment(1)
        });
      }
    }

    catch (error){
      console.error("Vote failed:", error);
    }
      
  
};

  //TODO
  // add upvote and downvote button 
  //need to add it to NowPlaying.jsx
  // need to connect it to spotify api


