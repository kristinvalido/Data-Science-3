import { db } from "./firebase"; //athen /confic 
import {doc, updateDoc, increment, getDoc, setDoc} from "firebase/firestore";


// this systems is already in voteSystem.js ask if need to be moved 
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
      
