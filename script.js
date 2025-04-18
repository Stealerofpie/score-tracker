/* -- to do --
- display leaderboard properly and sort
- separately record overall score
- display overall leaderboard
- add other games
- add message board / comments
*/

// Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
	apiKey: "AIzaSyDGRO1WFA4TTHU7BdQOtPg6ECTKt3et6k8",
	authDomain: "score-tracker-be52b.firebaseapp.com",
	projectId: "score-tracker-be52b",
	storageBucket: "score-tracker-be52b.appspot.com",
	messagingSenderId: "175857463815",
	appId: "1:175857463815:web:8b290df6cbf26bd76c70a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
var userName = "";
var userScore;
var scoreData = [];
var currentGame = "wordle";

// User list
var userList = [
    "Steve",
    "Sam",
    "Cliff",
    "Jasper",
    "Shefali",
    "Claire",
    "Ellie",
    "Emily",
    "Patrice",
    "Kate",
    "Beau",
    "Luke",
    "Jorja",
    "Linh",
    "Lily",
    "Trudy"
]

// Runs when DOM has loaded
document.addEventListener("DOMContentLoaded", function() {
    populateUserSelect();

    // Add event listeners for buttons
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("addScoreBtn").addEventListener("click", addScore);
    document.getElementById("savePlayerBtn").addEventListener("click", savePlayer);
    document.getElementById("clearScoreBtn").addEventListener("click", clearUserScore);

    // Load user info and scores based on who is logged in
    loadUser();
    updateUserScore();
    updateLeaderboard();
});

// Populate the user drop-down based on the userList
function populateUserSelect() {
    const select = document.getElementById("nameSelect");
    select.innerHTML = ""; // Clear existing options just in case

    for (const user of userList) {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        select.appendChild(option);
    }
}

// Determine who is logged in based on local storage, if nothing stored, show login screen
function loadUser() {
    userName = localStorage.getItem("currentUser")

    if (!userName) {
        document.getElementById("nameModal").style.display = "flex";
    } else {
        document.getElementById("labelHello").textContent = userName;
        document.getElementById("loginBtn").textContent = "Change user"
    }
}

// Show the login screen
function login() {
    document.getElementById("nameModal").style.display = "flex";
}

// Save score to Firestore
async function saveScore(username, gamename, date, score) {
    try {
        const scoreRef = doc(db, "users", username, "games", gamename, "date", date);
        await setDoc(scoreRef, {
            score: score
        });
        console.log("Score saved successfully!");
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// Load scores from Firestore by username and game
async function getScoresByGame(username, gamename) {
    try {
        const scoresCollectionRef = collection(db, "users", username, "games", gamename, "date");
        const querySnapshot = await getDocs(scoresCollectionRef);
        const scores = [];

        querySnapshot.forEach((doc) => {
            scores.push({date: doc.id, score: doc.data().score});
        });

        // Optional: Sort by date
        //scores.sort((a, b) => a.date.localeCompare(b.date));

        console.log("Retrieved scores:", scores);
        return scores;
    } catch (error) {
        console.error("Error getting scores:", error);
    }
}

// Load a particular score from Firestore by username, game name and date
async function getScoresByDate(username, gamename, date) {
    try {
        const scoreRef = doc(db, "users", username, "games", gamename, "date", date);
        const docSnap = await getDoc(scoreRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const scores = data.score;

            return scores;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting scores:", error);
        return null;
    }
}

// Determine score based on text entered by user and save to Firestore
async function addScore() {
    const score = parseScore(document.getElementById("scoreInput").value);

    // Save score if valid text was entered
    if (score) {
        await saveScore(userName, currentGame, getTodaysDate(), score);
        
    } else {
        alert("Invalid score entered - please use the \"Share\" button on Wordle to copy the results.");
    }

    await updateUserScore();
    await updateLeaderboard();
}

// Delete user's score from today
async function clearUserScore() {
    try {
        const scorePath = doc(db, "users", userName, "games", currentGame, "date", getTodaysDate());
        await deleteDoc(scorePath);
        console.log(`Deleted score for ${userName} on ${getTodaysDate()}`);
        userScore = null;
    } catch {
        console.log("Error deleting score:", error);
    }
    await updateUserScore()
    await updateLeaderboard();
}

// Parse the data entered by the user and return the score if found, otherwise return null
function parseScore(score) {
    const regex = /Wordle\s(\d{1,3}(?:,\d{3})*)\s(\d+\/\d+)/g;

    const matches = [...score.matchAll(regex)];

    if (matches.length > 0) {
        var wordleMatch = matches[0];
        var returnScore = wordleMatch[2];
        return returnScore[0];
    } else {
        console.log("Wordle not found");
    }

    return null;
}

// Store selected username to localstorage so we know who is logged in
function savePlayer() {
    const selectedName = document.getElementById("nameSelect").value;
    localStorage.setItem("currentUser", selectedName);
    userScore = null;
    document.getElementById("nameModal").style.display = "none";
    loadUser();
    updateUserScore();
}

// Update the leaderboard 
async function updateLeaderboard() {
    const leaderboardTextArea = document.getElementById("leaderboard");
    const todaysScores = {};

    for (const user of userList) {
        const uscore = await getScoresByDate(user, currentGame, getTodaysDate());
        if (uscore) {
            todaysScores[user] = uscore;
        }
    }

    // Update leaderboard text and eset height and scroll height
    leaderboardTextArea.value = JSON.stringify(todaysScores, null, 2);
    leaderboardTextArea.style.height = "auto";
    leaderboardTextArea.style.height = (leaderboardTextArea.scrollHeight) + "px";
}
/*
function updateLeaderboard() {
    const leaderboardTextArea = document.getElementById("leaderboard");

    let todaysScores = {}

    // Loop through users and add name and score to today's score list if there is a score
    for (let u in userList) {
        console.log(userList[u]);
        getScoresByDate(userList[u], currentGame, getTodaysDate())
        .then((uscore) => {
            console.log(uscore);
            if (uscore) {
                todaysScores[userList[u]] = uscore;
            }
        });
    }

    // Update leaderboard
    leaderboardTextArea.value = JSON.stringify(todaysScores, null, 2);
    
    // Reset height and scroll height
    leaderboardTextArea.style.height = "auto";
    leaderboardTextArea.style.height = (leaderboardTextArea.scrollHeight) + "px";

    /*const scoresArray = Object.entries(scoreData);

    scoresArray.sort((a, b) => b[1] - a[1]);

    const sortedScores = Object.fromEntries(scoresArray);

    let text = "";
    for (const name in sortedScores) {
        text += `${name}: ${scoreData[name]}\n`;
    }

    leaderboardTextArea.value = text.trim(); // Update textarea with scores*/
//}

// Get current user's score for today and store for use
async function updateUserScore() {
    const scoreUser = await getScoresByDate(userName, currentGame, getTodaysDate());

    if (scoreUser) {
        userScore = scoreUser;
    }

    checkForUserScore();
}

// Checks for saved score for this user and shows it if it's there or seeks a new score
function checkForUserScore() {
    if (userScore) {
        console.log("score - show it");
        document.getElementById("pasteScore").hidden = true;
        document.getElementById("clearScore").hidden = false;
        document.getElementById("currentUserScore").textContent = userScore;
    } else {
        console.log("no score - seek input");
        document.getElementById("pasteScore").hidden = false;
        document.getElementById("clearScore").hidden = true;
    }
}

function getTodaysDate() {
    return new Date().toISOString().split("T")[0];
}