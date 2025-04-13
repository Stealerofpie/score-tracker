/* -- to do --
- reset scores each day
- separately record overall score
- display overall leaderboard
- add message board / comments
- add other games
- 
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGRO1WFA4TTHU7BdQOtPg6ECTKt3et6k8",
    authDomain: "score-tracker-be52b.firebaseapp.com",
    projectId: "score-tracker-be52b",
    storageBucket: "score-tracker-be52b.firebasestorage.app",
    messagingSenderId: "175857463815",
    appId: "1:175857463815:web:8b290df6cbf26bd76c70a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
const scoresRef = collection(db, "scores"); // Reference to the "scores" collection

let userName = "no name";
let scoreData = {};

document.addEventListener("DOMContentLoaded", function() {
    loadUser();
    loadScores();
});

function loadUser() {
    userName = localStorage.getItem("currentUser")

    if (!userName) {
        document.getElementById("nameModal").style.display = "flex";
    } else {
        document.getElementById("labelHello").textContent = userName;
        document.getElementById("loginBtn").textContent = "Change user"
    }
}

function login() {
    document.getElementById("nameModal").style.display = "flex";
}

function saveScores(scores) {
    for (const name in scores) {
        const docRef = doc(db, "scores", name);  // Reference to the player's document in the "scores" collection
        setDoc(docRef, { score: scores[name] })  // Set the score for that player
            .then(() => {
                console.log("Scores saved successfully");
                loadScores();
            })
            .catch(error => console.error("Error saving scores:", error));
    }
}

function loadScores() {
    getDocs(scoresRef)
        .then(snapshot => {
            const scores = {};
            snapshot.forEach(doc => {
                scores[doc.id] = doc.data().score;  // Get the score from the document
            });

            scoreData = scores;
            updateLeaderboard();
            checkForUserScore();
        })
        .catch(error => console.error("Error loading scores:", error));
}

function addScore() {
    const score = parseScore(document.getElementById("scoreInput").value);

    if (score) {
        scoreData[userName] = score;

        saveScores(scoreData);
    } else {
        alert("Invalid score entered - please use the \"Share\" button on Wordle to copy the results.");
    }
}

function clearUserScore() {
    const docRef = doc(db, "scores", userName);  // Reference to the document
    deleteDoc(docRef)  // Delete the user's score document
        .then(() => {
            console.log("Score deleted");
            delete scoreData[userName];
            loadScores();
        })
        .catch(error => console.error("Error deleting score:", error));
}

function parseScore(score) {
    const regex = /Wordle\s(\d{1,3}(?:,\d{3})*)\s(\d+\/\d+)/g;

    const matches = [...score.matchAll(regex)];

    if (matches.length > 0) {
        wordleMatch = matches[0];
        returnScore = wordleMatch[2];
        return returnScore[0];
    } else {
        console.log("Wordle not found");
    }

    return null;
}

function savePlayer() {
    const selectedName = document.getElementById("nameSelect").value;
    localStorage.setItem("currentUser", selectedName);
    document.getElementById("nameModal").style.display = "none";
    loadUser();
    checkForUserScore();
}

function updateLeaderboard() {
    const leaderboardTextArea = document.getElementById("leaderboard");

    const scoresArray = Object.entries(scoreData);

    scoresArray.sort((a, b) => b[1] - a[1]);

    const sortedScores = Object.fromEntries(scoresArray);

    let text = "";
    for (const name in sortedScores) {
        text += `${name}: ${scoreData[name]}\n`;
    }

    leaderboardTextArea.value = text.trim(); // Update textarea with scores
    
    const lb = document.getElementById("leaderboard");
    lb.style.height = "auto"; // Reset height
    lb.style.height = (lb.scrollHeight) + "px"; // Set to scrollHeight
}

function checkForUserScore() {
    if (userName in scoreData) {
        document.getElementById("pasteScore").hidden = true;
        document.getElementById("clearScore").hidden = false;
        document.getElementById("currentUserScore").textContent = scoreData[userName];
    } else {
        document.getElementById("pasteScore").hidden = false;
        document.getElementById("clearScore").hidden = true;
    }
}
