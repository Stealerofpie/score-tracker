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
    fetch("http://127.0.0.1:5000/scores", {
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
    fetch("http://127.0.0.1:5000/scores")
        .then(response => response.json())
        .then(data => {
            console.log("Loaded scores:", data);

            scoreData = data;

            updateLeaderboard();
        })
        .catch(error => console.error("Error loading scores:", error));
}


function addScore() {
    const score = parseScore(document.getElementById("scoreInput").value);

    if (score) {
        scoreData[userName] = score;

        saveScores(scoreData);
    } else {
        alert("Invalid data entered");
    }
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