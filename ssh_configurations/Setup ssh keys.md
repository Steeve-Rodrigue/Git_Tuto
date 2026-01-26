# Setting Up SSH Keys for GitHub

## Overview
This guide will help you set up SSH keys for secure authentication with GitHub.

---

## 1. Generate your SSH key

**What it means:** We're creating a secret key pair on your computer so GitHub can trust it.

### macOS / Linux

1. Open **Terminal**
2. Run:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
3. Press **Enter** to accept the default file location
4. Enter a passphrase or press **Enter** twice to skip

### Windows

1. Open **PowerShell** or **Git Bash**
2. Run:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
3. Press **Enter** to accept defaults
4. Enter a passphrase or press **Enter** twice to skip

> **Tip:** Use the same email you use on GitHub.

---

## 2. Start the SSH agent & add your key

**What it means:** We're running a helper program that holds your secret key while you work.

### macOS / Linux

In Terminal, run:
```bash
eval "$(ssh-agent -s)"
```

Then run:
```bash
ssh-add ~/.ssh/id_ed25519
```

### Windows

In PowerShell or Git Bash, run:
```bash
eval "$(ssh-agent -s)"
```

Then run one of these:
```bash
ssh-add /c/Users/you/.ssh/id_ed25519
# or
ssh-add %USERPROFILE%\.ssh\id_ed25519
# or
ssh-add $HOME\.ssh\id_ed25519
```

---

## 3. Copy your public key

**What it means:** We're grabbing the "lock" part of your key pair to give to GitHub.

### macOS
```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

### Linux
```bash
xclip -sel clip < ~/.ssh/id_ed25519.pub
```
*(Install xclip via `sudo apt install xclip` if needed.)*

### Windows
```bash
clip < ~/.ssh/id_ed25519.pub
```

### Any OS (Manual Method)
Run:
```bash
cat ~/.ssh/id_ed25519.pub
```
Then manually select and copy the entire key.

---

## 4. Add the key to your GitHub account

**What it means:** We're telling GitHub "this key belongs to me" so it will let you in.

1. Log in at [github.com](https://github.com)
2. Click your **avatar** → **Settings** → **SSH and GPG keys**
3. Click **New SSH key**
4. In **Title**, type something like "My Laptop Key"
5. Paste your public key into the **Key** box
6. Click **Add SSH key** (enter your GitHub password if asked)

---

## 5. Test your SSH connection

**What it means:** We're checking that GitHub recognizes your key and lets you connect.

### macOS / Linux / Windows

Run:
```bash
ssh -T git@github.com
```

You should see:
```
Hi your_username! You've successfully authenticated, but GitHub does not provide shell access.
```

---

## 6. Troubleshooting: Re-add your SSH key (only if needed)

**What it means:** If GitHub later says "permission denied" or "repository not found," your SSH agent may have forgotten your key. This brings it back.

### Step 1: Go to your project folder

**macOS/Linux:**
```bash
cd ~/path/to/my-react-app
```

**Windows:**
```bash
cd C:\Users\you\Documents\my-react-app
```

### Step 2: Find your SSH key file name

**macOS/Linux:**
```bash
ls ~/.ssh
```

**Windows (PowerShell):**
```bash
ls $HOME\.ssh
```

Look for `id_ed25519` (private) and `id_ed25519.pub` (public).

### Step 3: Re-add your key to the agent

**macOS/Linux:**
```bash
ssh-add ~/.ssh/id_ed25519
```

**Windows:**
```bash
ssh-add /c/Users/you/.ssh/id_ed25519
```

### Step 4: Run your Git command again
While still in your project folder, run:
```bash
git pull
# or
git push
```

---

## Bonus: Reset a branch to an initial commit

If you need to completely reset your repository to start fresh:

```bash
git checkout --orphan temp-branch && \
git add . && \
git commit -m "Initial commit" && \
git branch -D main && \
git branch -m main && \
git push origin main --force
```

⚠️ **Warning:** This will permanently delete all commit history. Use with caution!

---

## All done! 🎉

Your computer can now securely push and pull code from GitHub over SSH.

**Happy coding!**