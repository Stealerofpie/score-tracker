const express = require("express");
const fs = require("fs");
const cors = require("cors"); // Allows frontend to connect
const app = express();

app.use(express.json()); // Allow JSON requests
app.use(cors()); // Prevent CORS issues

const FILE_PATH = "scores.json";

// 🟢 API to Get Scores
app.get("/scores", (req, res) => {
    if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, "utf8");
        res.json(JSON.parse(data));
    } else {
        res.json([]); // Return empty if no file exists
    }
});

// 🔴 API to Save Scores
app.post("/scores", (req, res) => {
    const scores = req.body;
    fs.writeFileSync(FILE_PATH, JSON.stringify(scores, null, 2));
    res.json({ message: "Scores saved successfully!" });
});

// Start server on port 3000
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
