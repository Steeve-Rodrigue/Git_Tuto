# Complete Git Hooks Tutorial - Part 2

## Table of Contents

1. [Method 1: Local Git Hooks](#method-1-local-git-hooks)
   - [Project Structure](#project-structure)
   - [Setup Process](#setup-process)
   - [Examples](#examples)
   - [Limitations](#limitations)

---

## Method 1: Local Git Hooks

Local hooks are scripts placed directly in `.git/hooks/` directory. Simple but not version controlled.

---

## Project Structure
```
my-project/
├── .git/
│   └── hooks/
│       ├── pre-commit          # Your hook script (executable)
│       ├── commit-msg          # Message validation hook
│       └── pre-push            # Push validation hook
├── pyproject.toml              # Ruff config (from Part 1)
├── src/
│   ├── __init__.py
│   └── main.py
└── tests/
    └── test_main.py
```

**Important**: Files in `.git/hooks/` are NOT tracked by Git!

---

## Setup Process

### Step 1: Navigate to Hooks Directory
```bash
cd /path/to/your/repository
cd .git/hooks
```

### Step 2: Create Hook File
```bash
# Create the hook
touch pre-commit

# Make it executable (required!)
chmod +x pre-commit
```

### Step 3: Edit the Hook

Open `.git/hooks/pre-commit` in your editor and add your script.

---

## Examples

### Example 1: Simple Bash Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "=== Pre-commit Checks ==="

# Get staged Python files
FILES=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)

if [ -z "$FILES" ]; then
    echo "No Python files staged"
    exit 0
fi

# Run Ruff check
ruff check $FILES || {
    echo "❌ Ruff failed"
    exit 1
}

echo "✅ Checks passed"
exit 0
```

**Usage:**
```bash
$ git add src/main.py
$ git commit -m "Add feature"
=== Pre-commit Checks ===
Running Ruff...
✅ Checks passed
[main abc1234] Add feature
```

### Example 2: Python Hook with Ruff Format + Check
```python
#!/usr/bin/env python3
# .git/hooks/pre-commit

import subprocess
import sys

print("=== Pre-commit Checks ===")

# Get staged Python files
result = subprocess.run(
    ["git", "diff", "--cached", "--name-only", "--diff-filter=d"],
    capture_output=True, text=True
)
files = [f for f in result.stdout.splitlines() if f.endswith(".py")]

if not files:
    print("No Python files")
    sys.exit(0)

# Format
print("Formatting...")
subprocess.run(["ruff", "format"] + files)

# Check
print("Checking...")
check = subprocess.run(["ruff", "check"] + files)

if check.returncode != 0:
    print("❌ Failed")
    sys.exit(1)

# Re-stage
subprocess.run(["git", "add"] + files)

print("✅ Passed")
sys.exit(0)
```

**Make executable:**
```bash
chmod +x .git/hooks/pre-commit
```

### Example 3: Commit Message Validation
```bash
#!/bin/bash
# .git/hooks/commit-msg

MSG_FILE=$1
MSG=$(cat "$MSG_FILE")

# Format: type(scope): description
PATTERN="^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"

if ! echo "$MSG" | grep -iqE "$PATTERN"; then
    echo "❌ Invalid format"
    echo "Use: type(scope): description"
    echo "Example: feat(auth): add login"
    exit 1
fi

echo "✅ Valid"
exit 0
```

**Make executable:**
```bash
chmod +x .git/hooks/commit-msg
```

**Usage:**
```bash
$ git commit -m "added stuff"
❌ Invalid format
Use: type(scope): description

$ git commit -m "feat(auth): add login"
✅ Valid
[main abc1234] feat(auth): add login
```

---

## Quick Commands

### Test Hook Manually
```bash
# Run the hook
.git/hooks/pre-commit

# Check syntax (Bash)
bash -n .git/hooks/pre-commit

# Check syntax (Python)
python3 .git/hooks/pre-commit
```

### Bypass Hooks
```bash
# Skip hooks (not recommended)
git commit --no-verify -m "Emergency fix"
```

### Get Staged Files
```bash
# All staged files
git diff --cached --name-only --diff-filter=d

# Python files only
git diff --cached --name-only --diff-filter=d | grep '\.py$'
```

---

## Limitations

| Problem | Description |
|---------|-------------|
| ❌ **Not version controlled** | Each dev must create hooks manually |
| ❌ **No sharing** | `.git/hooks/` not tracked by Git |
| ❌ **No updates** | Changes require manual redistribution |
| ❌ **Easy to bypass** | `--no-verify` skips all hooks |

### When to Use

**✅ Good for:**
- Personal projects
- Quick prototypes
- Learning hooks

**❌ Not for:**
- Team projects → Use Pre-commit Framework (Part 3)

---

## Troubleshooting

### Hook Not Running
```bash
# Check if executable
ls -l .git/hooks/pre-commit

# Fix permissions
chmod +x .git/hooks/pre-commit
```

### Wrong Shebang
```bash
# ❌ Bad (hardcoded path)
#!/bin/bash

# ✅ Good (finds in PATH)
#!/usr/bin/env bash
#!/usr/bin/env python3
```

### Files Not Found
```bash
# Debug: show staged files
git diff --cached --name-only

# Check if any Python files
git diff --cached --name-only | grep '\.py$'
```

---

**Next**: Part 3 - Pre-commit Framework (version controlled, team-friendly hooks).
