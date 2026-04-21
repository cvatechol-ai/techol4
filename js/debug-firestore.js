import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase-config.js";

async function debugFirestore() {
    console.log("Fetching all posts from Firestore...");
    try {
        const snapshot = await getDocs(collection(db, 'posts'));
        console.log(`Found ${snapshot.size} posts in 'posts' collection.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Post ID: ${doc.id}, Author: ${data.authorId}, CreatedAt:`, data.createdAt);
            if (data.createdAt && data.createdAt.toDate) {
                console.log("  -> Timestamp:", data.createdAt.toDate().toISOString());
            } else {
                console.log("  -> RAW:", typeof data.createdAt, data.createdAt);
            }
        });

        const aiSnapshot = await getDocs(collection(db, 'ai_posts'));
        console.log(`Found ${aiSnapshot.size} posts in 'ai_posts' collection.`);
        aiSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`AI Post ID: ${doc.id}, CreatedAt:`, data.createdAt);
        });
    } catch (e) {
        console.error("Debug Firestore Error:", e);
    }
}

window.debugFirestore = debugFirestore;
console.log("Debug Firestore script loaded. Call window.debugFirestore() in console.");
