import subprocess

print("📦 Deploy Script")

# Ask for a commit message
msg = input("Enter commit message: ")

# Run Git commands
subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", msg], check=True)
subprocess.run(["git", "push"], check=True)

print("✅ Deployment complete!")
