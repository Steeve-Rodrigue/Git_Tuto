# Complete Git Hooks Tutorial - Part 1

## Table of Contents

1. [Introduction to Git Hooks](#introduction-to-git-hooks)
2. [Understanding Git Hooks](#understanding-git-hooks)
3. [Available Git Hooks](#available-git-hooks)
4. [Configuring Ruff](#configuring-ruff)

---

## Introduction to Git Hooks

Git hooks are scripts that run automatically before or after Git events (commit, push, etc.).

### Why Use Hooks?

- Automate linting and formatting
- Enforce code standards
- Catch errors before commit
- Reduce CI/CD failures

**Example:**
```bash
# Without hooks
$ git commit -m "Add feature"
[main abc1234] Add feature
# CI fails later ❌

# With hooks
$ git commit -m "Add feature"
❌ Linting failed. Commit blocked.
```

---

## Understanding Git Hooks

### Location

Hooks live in `.git/hooks/`:
```bash
$ ls .git/hooks/
pre-commit.sample
commit-msg.sample
pre-push.sample
```

### Key Points

1. **Not version controlled** - In `.git/` directory
2. **Must be executable** - Use `chmod +x`
3. **Exit codes**:
   - `exit 0` = Allow action
   - `exit 1` = Block action

### Basic Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running checks..."
# Your checks here
exit 0
```

### Make Executable
```bash
chmod +x .git/hooks/pre-commit
```

### Bypass Hooks
```bash
git commit --no-verify -m "Skip hooks"
```

---

## Available Git Hooks

### Main Client-Side Hooks

| Hook | When | Use For |
|------|------|---------|
| `pre-commit` | Before commit | Linting, formatting |
| `commit-msg` | After message entered | Validate message format |
| `pre-push` | Before push | Run tests |
| `post-commit` | After commit | Notifications |

### Common Patterns

**Get staged Python files:**
```bash
git diff --cached --name-only --diff-filter=d | grep '\.py$'
```

**Check command result:**
```bash
command_to_run
if [ $? -ne 0 ]; then
    echo "❌ Failed"
    exit 1
fi
```

---

## Configuring Ruff

Before using hooks, configure Ruff (Python linter/formatter).

### Add this to your pyproject.toml file
```toml
# pyproject.toml

[tool.ruff]
line-length = 88
target-version = "py311"

# Enable rules
select = [
    "E",   # pycodestyle errors
    "F",   # pyflakes
    "I",   # isort (imports)
]

# Ignore rules
ignore = ["E501"]  # Line too long

# Exclude directories
exclude = [".git", "__pycache__", ".venv"]

[tool.ruff.format]
quote-style = "single"
```

### Common Rules

- `E` - Style errors (indentation, whitespace)
- `F` - Code errors (unused imports, undefined names)
- `I` - Import sorting
- `N` - Naming conventions
- `B` - Common bugs

### Test Configuration
```bash
# Check files
ruff check .

# Format files
ruff format .

# Auto-fix issues
ruff check --fix .
```

### Alternative: ruff.toml
```toml
# ruff.toml (alternative to pyproject.toml)

line-length = 88
select = ["E", "F", "I"]
ignore = ["E501"]
exclude = [".git", ".venv"]
```

**Recommendation**: Use `pyproject.toml` to keep all config in one file.

### Project Structure
```
my-project/
├── .git/
├── pyproject.toml       # Ruff config
├── src/
│   └── main.py
└── tests/
```

---

**Next**: Part 2 - Local Git Hooks with practical examples.
