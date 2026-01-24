# Complete Git Hooks Tutorial - Part 1

## Table of Contents

1. [Introduction to Git Hooks](#introduction-to-git-hooks)
2. [Understanding Git Hooks](#understanding-git-hooks)
3. [Available Git Hooks](#available-git-hooks)
4. [Configuring Linters and Formatters](#configuring-linters-and-formatters)

---

## Introduction to Git Hooks

Git hooks are scripts that Git executes automatically before or after events such as commit, push, and receive.

### Key Benefits

- **Automate tasks**: Linting, formatting, testing
- **Enforce standards**: Code style, commit message format
- **Catch errors early**: Before code enters the repository
- **Improve workflow**: Reduce CI/CD failures

### Example Impact

**Without hooks:**
```bash
$ git commit -m "Add feature"
[main abc1234] Add feature

# Later in CI...
❌ Build failed: Linting errors
```

**With hooks:**
```bash
$ git commit -m "Add feature"
Running pre-commit checks...
❌ Linting failed. Commit blocked.
Fix errors and try again.
```

---

## Understanding Git Hooks

### Location and Structure

Hooks are stored in `.git/hooks/` directory:
```bash
$ ls .git/hooks/
pre-commit.sample
commit-msg.sample
pre-push.sample
# ... other samples
```

### Key Characteristics

1. **Not version controlled** - Located in `.git/` directory
2. **Must be executable** - Requires `chmod +x`
3. **Language agnostic** - Bash, Python, Ruby, etc.
4. **Exit codes matter**:
   - `exit 0` = Success (allow action)
   - `exit 1` = Failure (block action)

### Basic Hook Structure
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e  # Exit on error

echo "Running checks..."

# Your validation logic here

exit 0  # Success
```

### Making a Hook Executable
```bash
# Create hook
$ touch .git/hooks/pre-commit

# Make executable (required!)
$ chmod +x .git/hooks/pre-commit

# Verify
$ ls -l .git/hooks/pre-commit
-rwxr-xr-x  1 user  staff  256 Jan 24 10:00 .git/hooks/pre-commit
```

### Bypassing Hooks
```bash
# Skip hooks when needed
$ git commit --no-verify -m "Emergency fix"
$ git push --no-verify
```

---

## Available Git Hooks

### Client-Side Hooks (Local Machine)

#### **pre-commit**
- **When**: Before commit message editor opens
- **Use**: Linting, formatting, syntax checking
- **Bypass**: `git commit --no-verify`

#### **prepare-commit-msg**
- **When**: After default message created, before editor
- **Use**: Auto-populate commit templates
- **Parameters**: Message file path, commit type, SHA

#### **commit-msg**
- **When**: After commit message entered
- **Use**: Validate commit message format
- **Parameters**: Path to commit message file

#### **post-commit**
- **When**: After commit completed
- **Use**: Notifications, logging
- **Cannot block**: Commit already made

#### **pre-rebase**
- **When**: Before rebase operation
- **Use**: Prevent rebasing published commits

#### **post-checkout**
- **When**: After `git checkout`
- **Use**: Update working directory, clear artifacts

#### **post-merge**
- **When**: After successful merge
- **Use**: Restore state, update dependencies

#### **pre-push**
- **When**: Before push to remote
- **Use**: Run tests, verify no secrets
- **Bypass**: `git push --no-verify`

### Server-Side Hooks (Git Server)

#### **pre-receive**
- **When**: Before any refs updated on remote
- **Use**: Enforce policies, reject pushes

#### **update**
- **When**: Once per branch being pushed
- **Use**: Branch-specific rules

#### **post-receive**
- **When**: After all refs updated
- **Use**: Trigger CI/CD, send notifications

### Hook Execution Flow
```
git commit
    ↓
pre-commit exists?
    ↓
Execute pre-commit
    ↓
exit 0? → Continue commit
exit 1? → Block commit
```

### Common Hook Patterns

#### Get Staged Files
```bash
# All staged files
git diff --cached --name-only --diff-filter=d

# Staged Python files only
git diff --cached --name-only --diff-filter=d | grep '\.py$'
```

#### Check Exit Status
```bash
command_to_run

if [ $? -ne 0 ]; then
    echo "❌ Command failed"
    exit 1
fi
```

#### Environment Variables
```bash
echo "Git dir: $GIT_DIR"
echo "Author: $GIT_AUTHOR_NAME"
echo "Editor: $GIT_EDITOR"
```

---

## Configuring Linters and Formatters

Before using hooks, you need to configure the tools they will run. Most linters and formatters use configuration files to define rules.

### Ruff Configuration

Ruff is a fast Python linter and formatter. It can be configured using either `pyproject.toml` or `ruff.toml`.

#### Option 1: Using pyproject.toml (Recommended)
```toml
# pyproject.toml

[project]
name = "my-project"
version = "1.0.0"

[tool.ruff]
# Line length
line-length = 88

# Python version
target-version = "py311"

# Enable specific rules
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
    "UP",  # pyupgrade
    "B",   # flake8-bugbear
]

# Ignore specific rules
ignore = [
    "E501",  # Line too long (handled by formatter)
]

# Exclude directories
exclude = [
    ".git",
    "__pycache__",
    ".venv",
    "build",
    "dist",
]

[tool.ruff.format]
# Use single quotes
quote-style = "single"

# Indent with spaces
indent-style = "space"

[tool.ruff.lint.isort]
# Import sorting
known-first-party = ["my_project"]
```

#### Option 2: Using ruff.toml
```toml
# ruff.toml

# Line length
line-length = 88

# Python version
target-version = "py311"

# Enable rules
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "N",   # pep8-naming
]

# Ignore rules
ignore = ["E501"]

# Exclude paths
exclude = [
    ".git",
    "__pycache__",
    ".venv",
]

[format]
quote-style = "single"
indent-style = "space"

[lint.isort]
known-first-party = ["my_project"]
```

### Common Ruff Rules

| Rule Code | Description | Example |
|-----------|-------------|---------|
| `E` | pycodestyle errors | Indentation, whitespace |
| `W` | pycodestyle warnings | Deprecated features |
| `F` | pyflakes | Unused imports, variables |
| `I` | isort | Import sorting |
| `N` | pep8-naming | Naming conventions |
| `UP` | pyupgrade | Modern Python syntax |
| `B` | flake8-bugbear | Common bugs |
| `C90` | mccabe | Complexity checking |

### Testing Your Configuration
```bash
# Check files with Ruff
ruff check .

# Format files with Ruff
ruff format .

# Check specific file
ruff check src/main.py

# Show what would be fixed
ruff check --diff .

# Auto-fix issues
ruff check --fix .
```

### Other Common Configurations

#### Black (Code Formatter)
```toml
# pyproject.toml

[tool.black]
line-length = 88
target-version = ['py311']
include = '\.pyi?$'
exclude = '''
/(
    \.git
  | \.venv
  | build
  | dist
)/
'''
```

#### Flake8 (Linter)
```ini
# .flake8

[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = 
    .git,
    __pycache__,
    .venv,
    build,
    dist
```

#### isort (Import Sorter)
```toml
# pyproject.toml

[tool.isort]
profile = "black"
line_length = 88
known_first_party = ["my_project"]
```

### Project Structure with Configuration
```
my-project/
├── .git/
├── pyproject.toml          # Ruff + project config
├── .gitignore
├── hooks/                  # Custom hook scripts (for later)
├── src/
│   ├── __init__.py
│   └── main.py
├── tests/
│   └── test_main.py
└── README.md
```

### Configuration Priority

Ruff looks for configuration in this order:

1. `ruff.toml` in current directory
2. `pyproject.toml` in current directory
3. `ruff.toml` in parent directories
4. `pyproject.toml` in parent directories

**Recommendation**: Use `pyproject.toml` to centralize all Python tool configurations.

---

**Next**: Part 2 will cover Method 1 (Local Git Hooks) with practical examples using these configurations.
