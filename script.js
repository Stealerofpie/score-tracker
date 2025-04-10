/* -- to do --
- reset scores each day
- separately record overall score
- display overall leaderboard
- add message board / comments
- add other games
- 
*/

let userName = "no name";
let scoreData = {};

const scoresURL = "https://score-tracker-4ygg.onrender.com/scores";

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
    fetch(scoresURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        loadScores();
    })
    .catch(error => console.error("Error saving scores:", error));
}

function loadScores() {
    fetch(scoresURL)
        .then(response => response.json())
        .then(data => {
            console.log("Loaded scores:", data);

            scoreData = data;

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
    if (userName in scoreData) {
        delete scoreData[userName];
    } else {
        console.log("It's not there");
    }
    saveScores(scoreData);
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