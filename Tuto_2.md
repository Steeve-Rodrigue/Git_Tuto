# Complete Git Hooks Tutorial - Part 2

## Table of Contents

1. [Method 1: Local Git Hooks](#method-1-local-git-hooks)
   - [Setup Process](#setup-process)
   - [Basic Examples](#basic-examples)
   - [Advanced Examples](#advanced-examples)
   - [Limitations](#limitations)

---

## Method 1: Local Git Hooks

Local Git hooks are scripts placed directly in `.git/hooks/` directory. This method gives full control but requires manual setup on each machine.

### Setup Process

#### Step 1: Navigate to Hooks Directory
```bash
cd /path/to/your/repository
cd .git/hooks
```

#### Step 2: Create Hook File
```bash
# Create the hook
touch pre-commit

# Make it executable (critical!)
chmod +x pre-commit
```

#### Step 3: Write Your Script

Open the file and add your validation logic with the appropriate shebang.

---

### Basic Examples

#### Example 1: Simple Bash Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "Running pre-commit checks..."

STAGED_PY=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)

if [ -n "$STAGED_PY" ]; then
    flake8 $STAGED_PY || {
        echo "❌ Linting failed"
        exit 1
    }
fi

echo "✅ Checks passed"
exit 0
```

**Output when failing:**
```bash
$ git commit -m "Add feature"
Running pre-commit checks...
file.py:5:1: F401 'os' imported but unused
❌ Linting failed
```

**Output when passing:**
```bash
$ git commit -m "Add feature"
Running pre-commit checks...
✅ Checks passed
[main abc1234] Add feature
```

#### Example 2: Python Pre-commit Hook
```python
#!/usr/bin/env python3
# .git/hooks/pre-commit

import subprocess
import sys

print("Running pre-commit checks...")

# Get staged Python files
result = subprocess.run(
    ["git", "diff", "--cached", "--name-only", "--diff-filter=d"],
    capture_output=True, text=True
)

files = [f for f in result.stdout.splitlines() if f.endswith(".py")]

if not files:
    print("No Python files staged")
    sys.exit(0)

# Run linter
check = subprocess.run(["flake8"] + files, capture_output=True)

if check.returncode != 0:
    print("❌ Linting failed:")
    print(check.stdout.decode())
    sys.exit(1)

print("✅ Checks passed")
sys.exit(0)
```

#### Example 3: Commit Message Validation
```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional commits pattern
PATTERN="^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"

if ! echo "$COMMIT_MSG" | grep -iqE "$PATTERN"; then
    echo "❌ Invalid commit message format"
    echo ""
    echo "Format: <type>(<scope>): <description>"
    echo "Example: feat(auth): add login feature"
    exit 1
fi

echo "✅ Commit message valid"
exit 0
```

**Output:**
```bash
$ git commit -m "added stuff"
❌ Invalid commit message format

Format: <type>(<scope>): <description>
Example: feat(auth): add login feature

$ git commit -m "feat(auth): add login feature"
✅ Commit message valid
[main abc1234] feat(auth): add login feature
```

---

### Advanced Examples

#### Multiple Checks in One Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

FAILED=0

# Check 1: Python linting
STAGED_PY=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)
if [ -n "$STAGED_PY" ]; then
    echo "Checking Python files..."
    flake8 $STAGED_PY || FAILED=1
fi

# Check 2: JavaScript linting
STAGED_JS=$(git diff --cached --name-only --diff-filter=d | grep '\.js$' || true)
if [ -n "$STAGED_JS" ]; then
    echo "Checking JavaScript files..."
    eslint $STAGED_JS || FAILED=1
fi

# Check 3: Prevent direct commits to main
BRANCH=$(git symbolic-ref --short HEAD)
if [ "$BRANCH" = "main" ]; then
    echo "❌ Direct commits to main not allowed"
    exit 1
fi

if [ $FAILED -eq 1 ]; then
    echo "❌ Pre-commit checks failed"
    exit 1
fi

echo "✅ All checks passed"
exit 0
```

#### Python Hook with Ruff
```python
#!/usr/bin/env python3
# .git/hooks/pre-commit

import subprocess
import sys

def get_staged_files():
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=d"],
        capture_output=True, text=True
    )
    return [f for f in result.stdout.splitlines() if f.endswith(".py")]

def main():
    files = get_staged_files()
    
    if not files:
        sys.exit(0)
    
    # Format
    subprocess.run(["ruff", "format"] + files)
    
    # Check
    result = subprocess.run(["ruff", "check"] + files, capture_output=True)
    
    if result.returncode != 0:
        print("❌ Ruff check failed")
        print(result.stdout.decode())
        sys.exit(1)
    
    # Re-stage
    subprocess.run(["git", "add"] + files)
    
    print("✅ Checks passed")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

---

### Useful Hook Patterns

#### Get Staged Files by Extension
```bash
# Python files
STAGED_PY=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)

# JavaScript files
STAGED_JS=$(git diff --cached --name-only --diff-filter=d | grep '\.js$' || true)

# All files
STAGED_ALL=$(git diff --cached --name-only --diff-filter=d)
```

#### Check Command Success
```bash
# Method 1: Using if
if command; then
    echo "Success"
else
    echo "Failed"
    exit 1
fi

# Method 2: Using ||
command || {
    echo "Failed"
    exit 1
}

# Method 3: Check exit code
command
if [ $? -ne 0 ]; then
    exit 1
fi
```

#### Colored Output
```bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}✓ Success${NC}"
echo -e "${RED}✗ Failed${NC}"
echo -e "${YELLOW}⚠ Warning${NC}"
```

---

### Sharing Hooks with Team

Since hooks in `.git/hooks/` aren't version controlled, you need alternative methods to share them:

#### Method 1: Manual Distribution
```bash
# Create hooks directory in repo
mkdir -p scripts/hooks

# Store hooks there
cp .git/hooks/pre-commit scripts/hooks/

# Team members copy manually
cp scripts/hooks/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit
```

#### Method 2: Setup Script
```bash
#!/bin/bash
# setup-hooks.sh

echo "Installing Git hooks..."

cp scripts/hooks/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit

cp scripts/hooks/commit-msg .git/hooks/
chmod +x .git/hooks/commit-msg

echo "✅ Hooks installed"
```

Team members run:
```bash
./setup-hooks.sh
```

#### Method 3: Git Config (Template)
```bash
# Create global hooks directory
mkdir -p ~/.git-templates/hooks

# Copy hooks there
cp scripts/hooks/* ~/.git-templates/hooks/
chmod +x ~/.git-templates/hooks/*

# Configure Git to use template
git config --global init.templateDir ~/.git-templates

# New clones automatically get hooks
```

---

### Limitations of Local Hooks

| Issue | Description | Impact |
|-------|-------------|--------|
| **Not version controlled** | Hooks in `.git/` aren't tracked | Team inconsistency |
| **Manual setup** | Each developer must install manually | Time-consuming |
| **No automatic updates** | Changes require redistribution | Outdated hooks |
| **Easy to bypass** | `--no-verify` flag skips hooks | Not enforceable |
| **Platform issues** | Bash scripts may fail on Windows | Cross-platform problems |

### When to Use Local Hooks

**Good for:**
- Personal projects
- Quick prototypes
- Learning Git hooks
- Simple, one-off checks

**Not ideal for:**
- Team projects (use pre-commit framework instead)
- Complex validation logic
- Cross-platform teams
- Hooks that need frequent updates

---

### Troubleshooting

#### Hook Not Running
```bash
# Check if executable
ls -l .git/hooks/pre-commit

# If not executable:
chmod +x .git/hooks/pre-commit
```

#### Hook Errors
```bash
# Test hook manually
.git/hooks/pre-commit

# Check for syntax errors
bash -n .git/hooks/pre-commit  # For bash
python3 .git/hooks/pre-commit  # For python
```

#### Wrong Shebang
```bash
# Wrong - won't work if bash not at /bin/bash
#!/bin/bash

# Better - finds bash in PATH
#!/usr/bin/env bash

# Same for Python
#!/usr/bin/env python3
```

#### Files Not Detected
```bash
# Debug: See what's staged
git diff --cached --name-only

# Check filter is working
git diff --cached --name-only | grep '\.py$'
```

---

**Next**: Part 3 will cover the Pre-commit Framework for better team collaboration and hook management.
