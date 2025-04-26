/* -- to do --
- auto-refresh feature (incomplete)
- consider 'highlights' for stats e.g. top by average, top by total
- add Hard Quiz
- add other games
- let users query by date range / weekly option
- create new GIT account
*/

// Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
var currentGame = "";
let allUserScoresByAvg = {};
let allUserScoresByTotal = {};
let orderedByAverage = true;

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
    "Trudy",
    "Ally"
];

// Declare regular expressions for each game
const gameDetails = {
    wordle: {
        regex: /Wordle\s(?:\d{1,3}(?:\d{3})*)\s(\d)\/\d+/g,
        ascending: true,
        averageRequired: true,
        gameLink: "https://www.nytimes.com/games/wordle/index.html"
    },
    timeGuesser: {
        regex: /TimeGuessr\s+#\d+\s+(\d+)\/[\d,]+/g,
        ascending: false,
        averageRequired: false,
        gameLink: "https://timeguessr.com/roundonedaily"
    },
    tradle: {}
}

// Runs when DOM has loaded
document.addEventListener("DOMContentLoaded", function() {
    initSite();
});

// Initialise website
function initSite() {
    populateUserSelect();

    // Add event listeners for buttons
    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("addScoreBtn").addEventListener("click", addScore);
    document.getElementById("savePlayerBtn").addEventListener("click", savePlayer);
    document.getElementById("clearScoreBtn").addEventListener("click", clearUserScore);
    document.getElementById("sendBtn").addEventListener("click", sendMessage);
    document.getElementById("orderByBtn").addEventListener("click", changeLeaderboardOrder);

    // Add event listener for pressing enter in score text area
    const scoreTextArea = document.getElementById("scoreInput");
    const addScoreBtn = document.getElementById("addScoreBtn");
    scoreTextArea.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevents a new line
            addScoreBtn.click();    // Simulate a button click
        }
    });

    // Add event listener for pressing enter in message text area
    const messageTextArea = document.getElementById("textareaMessage");
    const sendBtn = document.getElementById("sendBtn");
    messageTextArea.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevents a new line
            sendBtn.click();    // Simulate a button click
        }
    });
    
    // Add event listeners to game buttons
    const gameButtons = document.querySelectorAll(".gameBtn");
    gameButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentGame = button.getAttribute("data-game");
            localStorage.setItem("currentGame", currentGame);
            updateAllFields();
        });
    });

    updateAllFields();
    addUpdateListener();
}

// Add listener to allow auto-updates when new messages are sent
async function addUpdateListener() {
    try {
        // Ensure dates file is created (as a file not just a collection)
        await setDoc(doc(db, "games", currentGame, "dates", getTodaysDate()), { created: new Date() }, { merge: true });
        
        const messagesRef = collection(db, "games", currentGame, "dates", getTodaysDate(), "messages");

        // When a new doc is added, update the message area
        onSnapshot(messagesRef, (snapshot) => {  
            loadMessages();
        });
    } catch (error) {
        console.error("Error adding update listener:", error);
    }
}

// Load user info and scores based on who is logged in and update leaderboards
async function updateAllFields() {
    document.getElementById("leaderboard").value = "Loading...";
    document.getElementById("leaderboardAllTime").value = "Loading...";
    document.getElementById("currentUserScore").value = "Loading...";
    document.getElementById("labelCurrentGame").value = "Loading...";
    loadUser();
    loadGame();
    loadMessages();
    await updateUserScore();
    await updateLeaderboard();
    await updateLeaderboardAllTime();

    // Update current game label with link to that game
    const gameName =  currentGame.charAt(0).toUpperCase() + currentGame.slice(1);
    document.getElementById("labelCurrentGame").innerHTML = `<a href=${gameDetails[currentGame]["gameLink"]} target="_blank">${gameName}</a>`;
}

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

// Load current game from local storage
function loadGame() {
    const savedGame = localStorage.getItem("currentGame");
    if (savedGame) {
        currentGame = savedGame;
    } else {
        currentGame = "timeGuesser";
        localStorage.setItem("currentGame", currentGame);
    }
}

// Determine who is logged in based on local storage, if nothing stored, show login screen
function loadUser() {
    userName = localStorage.getItem("currentUser")
    userScore = null;

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
        // Ensure the date and user document exists
        await setDoc(doc(db, "games", gamename, "dates", date), { created: new Date() }, { merge: true });
        await setDoc(doc(db, "games", gamename, "users", username), { created: new Date() }, { merge: true });

        // Write to both places
        await setDoc(doc(db, "games", gamename, "dates", date, "users", username), { score });
        await setDoc(doc(db, "games", gamename, "users", username, "dates", date), { score });

        console.log("Score saved successfully!");
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// Load all scores and dates from Firestore for all users for a particular game
async function getScoresByGame(gamename) {
    try {
        const scores = [];
        const usersCollectionRef = collection(db, "games", gamename, "users");
        const userQuerySnapshot = await getDocs(usersCollectionRef);

        if (userQuerySnapshot.empty) {
            console.log("No user documents found in users subcollection.");
        }        

        for (const userDoc of userQuerySnapshot.docs) {
            const username = userDoc.id;
            const datesCollectionRef = collection(db, "games", gamename, "users", username, "dates");
            const dateQuerySnapshot = await getDocs(datesCollectionRef);

            dateQuerySnapshot.forEach((dateDoc) => {
                scores.push({
                    user: username,
                    date: dateDoc.id,
                    score: dateDoc.data().score
                });
            });
        }

        if (scores.length > 0) {
            return scores;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting scores:", error);
        return null;
    }
}

// Load a particular score from Firestore by username, game name and date
async function getUserScore(username, gamename, date) {
    try {
        const scoreRef = doc(db, "games", gamename, "dates", date, "users", username);
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

// Load scores for all users from Firestore by game and date
async function getScoresByDate(gamename, date) {
    try {
        const scoreRef = collection(db, "games", gamename, "dates", date, "users");
        const docSnap = await getDocs(scoreRef);
        const scores = {};

        docSnap.forEach((doc) => {
            scores[doc.id] = doc.data().score;
        });

        if (Object.keys(scores).length > 0) {
            return scores;
        } else {
            console.log("No scores to load.");
            return null;
        }
    } catch (error) {
        console.error("Error getting scores:", error);
        return null;
    }
}

// Determine score based on text entered by user and save to Firestore
async function addScore() {
    const scoreTextArea = document.getElementById("scoreInput");
    const score = parseScore(scoreTextArea.value);

    // Save score and clear text if valid text was entered
    if (score) {
        await saveScore(userName, currentGame, getTodaysDate(), score);
        scoreTextArea.value = "";
    } else {
        alert("Invalid score entered - please use the \"Share\" button on Wordle to copy the results.");
    }

    await updateUserScore();
    await updateLeaderboard();
    await updateLeaderboardAllTime();
}

// Delete user's score from today
async function clearUserScore() {
    try {
        await deleteDoc(doc(db, "games", currentGame, "dates", getTodaysDate(), "users", userName));
        await deleteDoc(doc(db, "games", currentGame, "users", userName, "dates", getTodaysDate()));
        console.log(`Deleted score for ${userName} on ${getTodaysDate()}`);
        userScore = null;
    } catch {
        console.log("Error deleting score:", error);
    }
    await updateUserScore()
    await updateLeaderboard();
    await updateLeaderboardAllTime();
}

// Parse the data entered by the user and return the score if found, otherwise return null
function parseScore(score) {
    const formattedScore = score.replace(/,/g, "");
    const regex = gameDetails[currentGame]["regex"];

    const matches = [...formattedScore.matchAll(regex)];

    if (matches.length > 0) {
        var scoreMatch = matches[0];
        var returnScore = scoreMatch[1];
        return returnScore;
    } else {
        console.log("Invalid score entered");
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

// Update the daily leaderboard 
async function updateLeaderboard() {
    const leaderboardTextArea = document.getElementById("leaderboard");

    // Get today's score for each user and add to object
    const todaysScores = await getScoresByDate(currentGame, getTodaysDate());

    // Convert the object to an array sorted by score
    if (todaysScores) {
        const sortedEntries = Object.entries(todaysScores).sort((a, b) => {
            if (gameDetails[currentGame]["ascending"]) {
                return Number(a[1]) - Number(b[1]);
            } else {
                return Number(b[1]) - Number(a[1]);
            }        
        });
    
        // Loop through results and add to a string for display purposes
        let displayText = "";
        for (const [name, score] of sortedEntries) {
            displayText += `${name}: ${score}\n`;
        }
        
        // Update leaderboard text and reset height and scroll height
        leaderboardTextArea.value = displayText.trim();
        leaderboardTextArea.style.height = "auto";
        leaderboardTextArea.style.height = (leaderboardTextArea.scrollHeight) + "px";
    } else {
        console.log("Failed to update daily leaderboard.");
    }
}

// Update the all-time leaderboard 
async function updateLeaderboardAllTime() {
    // Clear scores stored
    allUserScoresByAvg = {};
    allUserScoresByTotal = {};

    // Get all scores for each user
    const allScores = await getScoresByGame(currentGame);

    // Check non-null value returned
    if (allScores) {
        // Get totals for each user
        const userTotals = {};
        const userTotalsReady = {};

        allScores.forEach(({ user, score }) => {
            if (!userTotals[user]) {
                userTotals[user] = { total: 0, count: 0 };
                userTotalsReady[user] = 0;
            }
            userTotals[user].total += Number(score);
            userTotals[user].count += 1;

            userTotalsReady[user] += Number(score);
        });
    
        allUserScoresByTotal = userTotalsReady;

        // Calculate averages
        const averages = Object.entries(userTotals).reduce((acc, [user, stats]) => {
            acc[user] = (stats.total / stats.count).toFixed(1);
            return acc;
        }, {});
        
        allUserScoresByAvg = averages;
    }

    orderLeaderboardBy();
}

// Call when changing how all-time leaderbord is sorted
function orderLeaderboardBy() {
    const lb = document.getElementById("leaderboardAllTime");
    let scores;

    if (orderedByAverage) {
        scores = allUserScoresByAvg;
    } else {
        scores = allUserScoresByTotal;
    }

    // Convert the object to an array sorted by score
    const sortedEntries = Object.entries(scores).sort((a, b) => {
        if (gameDetails[currentGame]["ascending"]) {
            return Number(a[1]) - Number(b[1]);
        } else {
            return Number(b[1]) - Number(a[1]);
        }
    });
    
    // Loop through results and add to a string for display purposes
    let displayText = "";
    for (const [name, score] of sortedEntries) {
        displayText += `${name}: ${score}\n`;
    }

    // Update leaderboard text and reset height and scroll height
    lb.value = displayText.trim();
    lb.style.height = "auto";
    lb.style.height = (lb.scrollHeight) + "px";

    // Update the text of the order button
    if (orderedByAverage) {
        document.getElementById("orderByBtn").textContent = "Ordered by average";
    } else {
        document.getElementById("orderByBtn").textContent = "Ordered by total";
    }
}

// Called when order button clicked
function changeLeaderboardOrder() {
    orderedByAverage = !orderedByAverage;
    orderLeaderboardBy();
}

// Get current user's score for today and store for use
async function updateUserScore() {
    const scoreUser = await getUserScore(userName, currentGame, getTodaysDate());

    if (scoreUser) {
        userScore = scoreUser;
    }

    checkForUserScore();
}

// Checks for saved score for this user and shows it if it's there or seeks a new score
function checkForUserScore() {
    if (userScore) {
        document.getElementById("pasteScore").hidden = true;
        document.getElementById("clearScore").hidden = false;
        document.getElementById("messageBoard").hidden = false;
        document.getElementById("currentUserScore").textContent = userScore;
    } else {
        document.getElementById("pasteScore").hidden = false;
        document.getElementById("clearScore").hidden = true;
        document.getElementById("messageBoard").hidden = true;
    }
}

// Get today's date based on local time and put into usable form
function getTodaysDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Get current time and return with seconds
function getCurrentTime() {
    const now = new Date();

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const currentTime = `${hours}:${minutes}:${seconds}`;

    return currentTime;
}

// Take message from textarea, save to Firestore then update message field
async function sendMessage() {
    // Take text from textarea and restore to placeholder text
    const textareaMessage = document.getElementById("textareaMessage");
    const newMessage = textareaMessage.value;
    textareaMessage.value = "";

    // Save message content to Firestore
    try {
        // Generate message name based on username and time sent
        const messageTime = getCurrentTime();
        const messageName = `${userName}-${messageTime}`;
        const messageRef = doc(db, "games", currentGame, "dates", getTodaysDate(), "messages", messageName);
        await setDoc(messageRef, {
            user: userName,
            time: messageTime,
            message: newMessage
        });
        console.log("Message saved successfully!");
    } catch (error) {
        console.error("Error saving message:", error);
    }
    loadMessages();
}

// Load messages from Firestore and add to the message area noting username and time sent
async function loadMessages() {
    // Clear message area to avoid duplication
    document.getElementById("messageArea").textContent = "";

    try {
        const messagesRef = collection(db, "games", currentGame, "dates", getTodaysDate(), "messages");
        const messagesQuery = query(messagesRef, orderBy("time"));
        const querySnapshot = await getDocs(messagesQuery);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            addNewMessage(data.user, data.time, data.message);
        });

    } catch (error) {
        console.error("Error getting messages:", error);
        return null;
    }
}

// Helper function appends the message to the DOM
function addNewMessage(user, time, message) {
    const messageArea = document.getElementById("messageArea");

    // Create a new elements
    const messageDiv = document.createElement('div');
    const messageTag = document.createElement('p');
    const messageContent = document.createElement('p');

    // Add classes
    messageDiv.classList.add("message");
    messageTag.classList.add("meta");
    messageContent.classList.add("text");

    // Add text to the <p> elements
    messageTag.textContent = `${user} - ${time}`;
    messageContent.textContent = message;

    if (user === userName) {
        messageTag.style.textAlign = "right";
        messageContent.style.textAlign = "right";
    }

    // Append the elements to the div
    messageDiv.appendChild(messageTag);
    messageDiv.appendChild(messageContent);
    messageArea.appendChild(messageDiv);
} 