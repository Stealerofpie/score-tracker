from flask import Flask, request, jsonify
import json
import os
from flask_cors import CORS
import shutil

FILE_PATH = "scores.json"
TEMPLATE_PATH = "scores_template.json"

# 🧠 If scores.json doesn't exist, create it from the template
if not os.path.exists(FILE_PATH):
    shutil.copy(TEMPLATE_PATH, FILE_PATH)

app = Flask(__name__)
CORS(app)  # Allows frontend to connect

# Use relative path for scores.json
FILE_PATH = os.path.join(os.getcwd(), "scores.json")

# 🟢 Get scores (GET request)
@app.route("/scores", methods=["GET"])
def get_scores():
    try:
        with open(FILE_PATH, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []  # Default to empty list if file doesn't exist
    return jsonify(data)

# 🔴 Save scores (POST request)
@app.route("/scores", methods=["POST"])
def save_scores():
    scores = request.json  # Get JSON data from request
    
    with open(FILE_PATH, "w") as f:
        json.dump(scores, f, indent=2)
    return jsonify({"message": "Scores saved successfully!"})

# Run the server
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

@app.route("/")
def home():
    return "Score Tracker backend is running."

@app.route("/clear-scores", methods=["POST"])
def clear_scores():
    with open("scores.json", "w") as f:
        json.dump({}, f)
    return jsonify({"message": "Scores cleared!"})
