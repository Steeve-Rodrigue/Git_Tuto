# Complete Git Hooks Tutorial

## Table of Contents

1. [Introduction to Git Hooks](#introduction-to-git-hooks)
2. [Understanding Git Hooks](#understanding-git-hooks)
3. [Available Git Hooks](#available-git-hooks)
4. [Method 1: Local Git Hooks](#method-1-local-git-hooks)
5. [Method 2: Pre-commit Framework](#method-2-pre-commit-framework)
6. [Complete Code Examples](#complete-code-examples)

---

## Introduction to Git Hooks

Git hooks are scripts that Git executes automatically before or after events such as commit, push, and receive. They allow you to automate tasks, enforce coding standards, run tests, and maintain code quality across your development workflow.

**Key Benefits:**
- Automate repetitive tasks (linting, formatting, testing)
- Enforce team standards and conventions
- Catch errors before they enter the repository
- Improve code quality and consistency
- Integrate with CI/CD pipelines

---

## Understanding Git Hooks

Git hooks are stored in the `.git/hooks` directory of every Git repository. When you initialize a repository with `git init`, Git creates sample hook scripts (ending in `.sample`) that you can activate by removing the `.sample` extension.

**Important Characteristics:**
- Hooks are **local** to each repository
- They are **not** tracked by version control (inside `.git/` directory)
- They must be **executable** (require `chmod +x` on Unix-like systems)
- They can be written in any scripting language (Bash, Python, Ruby, etc.)
- Non-zero exit codes prevent the Git action from completing

---

## Available Git Hooks

### Client-Side Hooks

These hooks run on the developer's local machine:

#### Pre-commit Hooks

**`pre-commit`**
- **When**: Before commit message is created
- **Use cases**: Linting, formatting, syntax checking
- **Can be bypassed**: `git commit --no-verify`

**`prepare-commit-msg`**
- **When**: After default commit message is created, before editor opens
- **Use cases**: Auto-populate commit message templates
- **Parameters**: Path to commit message file, commit type, commit SHA (for amend)

**`commit-msg`**
- **When**: After commit message is entered
- **Use cases**: Validate commit message format (conventional commits)
- **Parameters**: Path to commit message file

**`post-commit`**
- **When**: After commit is completed
- **Use cases**: Notifications, logging, triggering external actions
- **Cannot block**: Commit has already been made

#### Other Client-Side Hooks

**`pre-rebase`**
- **When**: Before rebase operation
- **Use cases**: Prevent rebasing published commits

**`post-checkout`**
- **When**: After successful `git checkout`
- **Use cases**: Update working directory, clear build artifacts

**`post-merge`**
- **When**: After successful merge
- **Use cases**: Restore working directory state, update dependencies

**`pre-push`**
- **When**: Before push to remote
- **Use cases**: Run tests, verify no sensitive data is pushed
- **Can be bypassed**: `git push --no-verify`

### Server-Side Hooks

These hooks run on the Git server:

**`pre-receive`**
- **When**: Before any refs are updated on remote
- **Use cases**: Enforce policies, reject certain pushes

**`update`**
- **When**: Once per branch being pushed
- **Use cases**: Branch-specific rules

**`post-receive`**
- **When**: After all refs are updated
- **Use cases**: Trigger CI/CD, send notifications

---

## Method 1: Local Git Hooks

Local Git hooks are scripts placed directly in the `.git/hooks` directory. This method gives you full control but requires manual setup on each machine.

### Setup Process

#### Step 1: Create the Hook Script

Navigate to your repository's hooks directory:
```bash
cd /path/to/your/repository
cd .git/hooks
```

Create a new hook file (e.g., `pre-commit`):
```bash
touch pre-commit
```

#### Step 2: Make the Hook Executable
```bash
chmod +x pre-commit
```

#### Step 3: Write Your Hook Script

Open the hook file in your editor and add your script. The shebang line at the top determines which interpreter to use.

### Example 1: Basic Pre-commit Hook (Bash)
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e  # Exit immediately if a command exits with a non-zero status

echo "=== Running Pre-commit Checks ==="

# Get list of staged Python files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)

# If no Python files are staged, exit successfully
if [ -z "$STAGED_FILES" ]; then
    echo "No Python files staged. Skipping checks."
    exit 0
fi

echo "Staged Python files:"
echo "$STAGED_FILES"

# Run flake8 linter on staged files
echo ""
echo "Running flake8..."
flake8 $STAGED_FILES

# Check if flake8 failed
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Commit blocked: Linting errors found."
    echo "Fix the errors above and try again."
    exit 1
fi

echo ""
echo "✅ All checks passed. Commit allowed."
exit 0
```

**Example output when linting fails:**
```
$ git commit -m "Add new feature"
=== Running Pre-commit Checks ===
Staged Python files:
src/main.py
src/utils.py

Running flake8...
src/main.py:5:1: F401 'os' imported but unused
src/utils.py:10:80: E501 line too long (85 > 79 characters)

❌ Commit blocked: Linting errors found.
Fix the errors above and try again.
```

**Example output when checks pass:**
```
$ git commit -m "Add new feature"
=== Running Pre-commit Checks ===
Staged Python files:
src/main.py

Running flake8...

✅ All checks passed. Commit allowed.
[main abc1234] Add new feature
 1 file changed, 10 insertions(+)
```

### Example 2: Advanced Pre-commit Hook with Multiple Checks (Bash)
```bash
#!/bin/bash
# .git/hooks/pre-commit

set -e

echo "=== Pre-commit Quality Checks ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get staged files
STAGED_PY_FILES=$(git diff --cached --name-only --diff-filter=d | grep '\.py$' || true)
STAGED_JS_FILES=$(git diff --cached --name-only --diff-filter=d | grep '\.js$' || true)

# Flag to track if any check fails
CHECKS_FAILED=0

# Check 1: Python linting
if [ -n "$STAGED_PY_FILES" ]; then
    echo "📝 Checking Python files with flake8..."
    if flake8 $STAGED_PY_FILES; then
        echo -e "${GREEN}✓ Python linting passed${NC}"
    else
        echo -e "${RED}✗ Python linting failed${NC}"
        CHECKS_FAILED=1
    fi
    echo ""
fi

# Check 2: Python formatting
if [ -n "$STAGED_PY_FILES" ]; then
    echo "🎨 Checking Python formatting with black..."
    if black --check $STAGED_PY_FILES; then
        echo -e "${GREEN}✓ Python formatting passed${NC}"
    else
        echo -e "${YELLOW}⚠ Python files need formatting${NC}"
        echo "Run: black $STAGED_PY_FILES"
        CHECKS_FAILED=1
    fi
    echo ""
fi

# Check 3: JavaScript linting
if [ -n "$STAGED_JS_FILES" ]; then
    echo "📝 Checking JavaScript files with eslint..."
    if eslint $STAGED_JS_FILES; then
        echo -e "${GREEN}✓ JavaScript linting passed${NC}"
    else
        echo -e "${RED}✗ JavaScript linting failed${NC}"
        CHECKS_FAILED=1
    fi
    echo ""
fi

# Check 4: Prevent commits to protected branches
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    echo -e "${RED}✗ Direct commits to $CURRENT_BRANCH are not allowed${NC}"
    echo "Please create a feature branch and submit a pull request."
    exit 1
fi

# Check 5: Search for common issues
echo "🔍 Searching for common issues..."
if git diff --cached | grep -E "(console\.log|debugger|TODO|FIXME|XXX)" > /dev/null; then
    echo -e "${YELLOW}⚠ Found debug statements or TODO comments:${NC}"
    git diff --cached | grep -n -E "(console\.log|debugger|TODO|FIXME|XXX)"
    echo ""
    echo -e "${YELLOW}Consider removing these before committing${NC}"
    # Uncomment the next line to block commits with these patterns
    # CHECKS_FAILED=1
fi
echo ""

# Final result
if [ $CHECKS_FAILED -eq 1 ]; then
    echo -e "${RED}❌ Pre-commit checks failed. Commit blocked.${NC}"
    echo "Fix the issues above and try again."
    echo ""
    echo "To bypass these checks (not recommended), use:"
    echo "  git commit --no-verify"
    exit 1
fi

echo -e "${GREEN}✅ All pre-commit checks passed!${NC}"
exit 0
```

### Example 3: Python Pre-commit Hook with Ruff
```python
#!/usr/bin/env python3
# .git/hooks/pre-commit

import subprocess
import sys

def run_command(command, error_message):
    """Run a shell command and handle errors."""
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout, result.returncode
    except subprocess.CalledProcessError as e:
        print(f"Error: {error_message}")
        print(e.stderr)
        return e.stdout, e.returncode

def get_staged_python_files():
    """Get list of staged Python files."""
    stdout, _ = run_command(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=d"],
        "Failed to get staged files"
    )
    
    files = [f for f in stdout.splitlines() if f.endswith(".py")]
    return files

def main():
    print("=== Ruff Pre-commit Hook ===\n")
    
    # Get staged Python files
    staged_files = get_staged_python_files()
    
    if not staged_files:
        print("No Python files staged. Commit allowed.")
        sys.exit(0)
    
    print(f"Checking {len(staged_files)} Python file(s):\n")
    for file in staged_files:
        print(f"  - {file}")
    print()
    
    # Step 1: Auto-format with ruff
    print("[1/3] Running ruff format...")
    _, returncode = run_command(
        ["ruff", "format"] + staged_files,
        "Ruff format failed"
    )
    
    if returncode == 0:
        print("✓ Formatting complete\n")
    else:
        print("✗ Formatting failed\n")
        sys.exit(1)
    
    # Step 2: Check with ruff
    print("[2/3] Running ruff check...")
    stdout, returncode = run_command(
        ["ruff", "check"] + staged_files,
        "Ruff check failed"
    )
    
    if returncode != 0:
        print("✗ Ruff check found errors:\n")
        print(stdout)
        print("\n❌ Commit blocked: Fix the errors above and try again.")
        print("\nTo bypass (not recommended): git commit --no-verify")
        sys.exit(1)
    
    print("✓ No issues found\n")
    
    # Step 3: Re-stage modified files
    print("[3/3] Re-staging formatted files...")
    _, returncode = run_command(
        ["git", "add"] + staged_files,
        "Failed to re-stage files"
    )
    
    if returncode == 0:
        print("✓ Files re-staged\n")
    else:
        sys.exit(1)
    
    print("✅ All checks passed. Commit allowed.")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

**Example output:**
```
$ git commit -m "Add user authentication"
=== Ruff Pre-commit Hook ===

Checking 2 Python file(s):

  - src/auth.py
  - src/models.py

[1/3] Running ruff format...
✓ Formatting complete

[2/3] Running ruff check...
✗ Ruff check found errors:

src/auth.py:15:5: F401 [*] `hashlib` imported but unused
src/models.py:23:1: E501 Line too long (95 > 88)

❌ Commit blocked: Fix the errors above and try again.

To bypass (not recommended): git commit --no-verify
```

### Example 4: Commit Message Validation Hook
```bash
#!/bin/bash
# .git/hooks/commit-msg

set -e

# Get the commit message file path (passed as first argument)
COMMIT_MSG_FILE=$1

# Read the commit message
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

echo "=== Validating Commit Message ==="
echo ""
echo "Message: $COMMIT_MSG"
echo ""

# Define the regex pattern for conventional commits
# Format: type(scope): description
# Example: feat(auth): add login functionality
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,}"

if ! echo "$COMMIT_MSG" | grep -iqE "$PATTERN"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit messages must follow the Conventional Commits format:"
    echo ""
    echo "  <type>(<scope>): <description>"
    echo ""
    echo "Types allowed:"
    echo "  - feat:     New feature"
    echo "  - fix:      Bug fix"
    echo "  - docs:     Documentation changes"
    echo "  - style:    Code style changes (formatting, etc.)"
    echo "  - refactor: Code refactoring"
    echo "  - test:     Adding or updating tests"
    echo "  - chore:    Maintenance tasks"
    echo "  - perf:     Performance improvements"
    echo "  - ci:       CI/CD changes"
    echo "  - build:    Build system changes"
    echo "  - revert:   Revert a previous commit"
    echo ""
    echo "Examples:"
    echo "  ✓ feat(auth): add user login"
    echo "  ✓ fix: resolve memory leak"
    echo "  ✓ docs(readme): update installation steps"
    echo ""
    echo "Your message: $COMMIT_MSG"
    exit 1
fi

# Check minimum description length
DESCRIPTION=$(echo "$COMMIT_MSG" | cut -d':' -f2- | xargs)
if [ ${#DESCRIPTION} -lt 10 ]; then
    echo "❌ Commit description too short!"
    echo "Description must be at least 10 characters."
    echo "Current length: ${#DESCRIPTION}"
    exit 1
fi

echo "✅ Commit message valid!"
exit 0
```

**Example output (invalid message):**
```
$ git commit -m "added stuff"
=== Validating Commit Message ===

Message: added stuff

❌ Invalid commit message format!

Commit messages must follow the Conventional Commits format:

  <type>(<scope>): <description>

Types allowed:
  - feat:     New feature
  - fix:      Bug fix
  ...

Examples:
  ✓ feat(auth): add user login
  ✓ fix: resolve memory leak

Your message: added stuff
```

**Example output (valid message):**
```
$ git commit -m "feat(auth): add user authentication system"
=== Validating Commit Message ===

Message: feat(auth): add user authentication system

✅ Commit message valid!
[main 1234abc] feat(auth): add user authentication system
 3 files changed, 150 insertions(+)
```

### Limitations of Local Hooks

1. **Not version controlled**: Hooks in `.git/hooks` are not tracked by Git
2. **Manual setup required**: Each team member must manually copy hooks
3. **Inconsistent across team**: Different developers may have different hooks
4. **Difficult to update**: Changes require manual distribution
5. **No central management**: No easy way to enforce hooks across the team

**Solution**: Use the pre-commit framework for team-wide, versioned hooks.

---

## Method 2: Pre-commit Framework

The [pre-commit framework](https://pre-commit.com/) is a Python-based tool that manages Git hooks in a versioned, shareable way. It allows you to define hooks in a configuration file that can be committed to your repository.

### Why Use Pre-commit Framework?

**Advantages:**
- ✅ Version controlled (`.pre-commit-config.yaml`)
- ✅ Easy to share across team
- ✅ Large ecosystem of pre-built hooks
- ✅ Automatic hook updates
- ✅ Language-agnostic
- ✅ Easy installation and setup
- ✅ Supports both third-party and local custom hooks

### Installation

#### Step 1: Install pre-commit

Using pip:
```bash
pip install pre-commit
```

Using pipx (recommended for isolated installation):
```bash
pipx install pre-commit
```

Using Homebrew (macOS):
```bash
brew install pre-commit
```

Verify installation:
```bash
pre-commit --version
# Output: pre-commit 3.x.x
```

#### Step 2: Create Configuration File

Create a file named `.pre-commit-config.yaml` in the root of your repository:
```bash
touch .pre-commit-config.yaml
```

#### Step 3: Install Git Hook Scripts

This command installs the pre-commit hook into your `.git/hooks` directory:
```bash
pre-commit install
```

Output:
```
pre-commit installed at .git/hooks/pre-commit
```

#### Step 4: (Optional) Install Other Hook Types

Install commit-msg hook:
```bash
pre-commit install --hook-type commit-msg
```

Install pre-push hook:
```bash
pre-commit install --hook-type pre-push
```

### Basic Configuration

Here's a basic `.pre-commit-config.yaml` example:
```yaml
# .pre-commit-config.yaml

# Default settings for all hooks
default_stages: [commit]
fail_fast: false  # Run all hooks even if one fails

repos:
  # Trailing whitespace and file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: detect-private-key

  # Python code formatting with black
  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11

  # Python linting with flake8
  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=88', '--extend-ignore=E203']
```

### Advanced Configuration with Ruff

Ruff is a fast Python linter and formatter. Here's a comprehensive configuration:
```yaml
# .pre-commit-config.yaml

repos:
  # Pre-commit's built-in hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
        name: Trim trailing whitespace
      - id: end-of-file-fixer
        name: Fix end of files
      - id: check-yaml
        name: Check YAML syntax
      - id: check-toml
        name: Check TOML syntax
      - id: check-json
        name: Check JSON syntax
      - id: check-added-large-files
        name: Check for large files
        args: ['--maxkb=500']
      - id: check-merge-conflict
        name: Check for merge conflicts
      - id: detect-private-key
        name: Detect private keys
      - id: mixed-line-ending
        name: Fix mixed line endings
        args: ['--fix=lf']

  # Ruff - Fast Python linter and formatter
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.14
    hooks:
      # Ruff formatter (replaces black)
      - id: ruff-format
        name: Format Python code with Ruff
        
      # Ruff linter (replaces flake8, isort, and more)
      - id: ruff
        name: Lint Python code with Ruff
        args: ['--fix', '--exit-non-zero-on-fix']
```

### Configuration with Custom Local Hooks

You can combine third-party hooks with your own custom scripts:
```yaml
# .pre-commit-config.yaml

repos:
  # Third-party hooks
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.14
    hooks:
      - id: ruff-format
      - id: ruff
        args: ['--fix']

  # Local custom hooks
  - repo: local
    hooks:
      # Custom Python hook
      - id: custom-python-checks
        name: Custom Python Quality Checks
        entry: python hooks/custom_checks.py
        language: system
        types: [python]
        pass_filenames: true
        
      # Custom security check
      - id: check-secrets
        name: Check for hardcoded secrets
        entry: python hooks/check_secrets.py
        language: system
        types: [python]
        
      # Run tests
      - id: run-unit-tests
        name: Run unit tests
        entry: pytest tests/ -v --tb=short
        language: system
        pass_filenames: false
        stages: [push]  # Only run on push, not on commit
```

### Custom Hook Script Example

Create a custom hook script in `hooks/custom_checks.py`:
```python
#!/usr/bin/env python3
# hooks/custom_checks.py

"""
Custom pre-commit hook for additional quality checks.
This hook is called by pre-commit framework with filenames as arguments.
"""

import sys
import re
from pathlib import Path

def check_file(filepath):
    """Run custom checks on a single file."""
    errors = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        lines = content.splitlines()
    
    # Check 1: No print statements in production code
    if 'print(' in content and '/tests/' not in str(filepath):
        print_lines = [i+1 for i, line in enumerate(lines) if 'print(' in line]
        errors.append(
            f"  ❌ Found print() statement(s) on line(s): {', '.join(map(str, print_lines))}"
        )
    
    # Check 2: No bare except clauses
    if re.search(r'except\s*:', content):
        except_lines = [i+1 for i, line in enumerate(lines) if re.search(r'except\s*:', line)]
        errors.append(
            f"  ❌ Found bare except clause(s) on line(s): {', '.join(map(str, except_lines))}"
        )
    
    # Check 3: No TODO comments without issue number
    todo_pattern = r'#\s*TODO(?!\s*\(#\d+\))'
    if re.search(todo_pattern, content):
        todo_lines = [i+1 for i, line in enumerate(lines) if re.search(todo_pattern, line)]
        errors.append(
            f"  ❌ Found TODO without issue reference on line(s): {', '.join(map(str, todo_lines))}\n"
            f"     Use format: # TODO(#123) description"
        )
    
    return errors

def main():
    """Main function to check all provided files."""
    if len(sys.argv) < 2:
        print("No files to check.")
        sys.exit(0)
    
    filenames = sys.argv[1:]
    print(f"\n=== Running Custom Quality Checks on {len(filenames)} file(s) ===\n")
    
    all_errors = {}
    
    for filename in filenames:
        filepath = Path(filename)
        if not filepath.exists():
            continue
            
        errors = check_file(filepath)
        if errors:
            all_errors[filename] = errors
    
    # Report results
    if all_errors:
        print("❌ Custom checks failed:\n")
        for filename, errors in all_errors.items():
            print(f"File: {filename}")
            for error in errors:
                print(error)
            print()
        
        print("Fix these issues and try again.")
        sys.exit(1)
    
    print("✅ All custom checks passed!\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

Make the script executable:
```bash
chmod +x hooks/custom_checks.py
```

### Complete Ruff Custom Hook Example

Create `hooks/ruff_precommit.py`:
```python
#!/usr/bin/env python3
# hooks/ruff_precommit.py

"""
Custom Ruff pre-commit hook with detailed output and auto-fixing.
This hook formats code, checks for issues, and re-stages modified files.
"""

import subprocess
import sys
from pathlib import Path

class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def run_command(command, capture=True):
    """
    Run a shell command and return the result.
    
    Args:
        command: List of command arguments
        capture: Whether to capture output
        
    Returns:
        Tuple of (stdout, stderr, returncode)
    """
    try:
        if capture:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=False
            )
            return result.stdout, result.stderr, result.returncode
        else:
            result = subprocess.run(command, check=False)
            return "", "", result.returncode
    except Exception as e:
        print(f"{Colors.RED}Error running command: {' '.join(command)}{Colors.END}")
        print(f"{Colors.RED}{str(e)}{Colors.END}")
        return "", str(e), 1

def get_staged_python_files():
    """Get list of staged Python files."""
    stdout, stderr, returncode = run_command([
        "git", "diff", "--cached", "--name-only", "--diff-filter=d"
    ])
    
    if returncode != 0:
        print(f"{Colors.RED}Failed to get staged files{Colors.END}")
        sys.exit(1)
    
    files = [f for f in stdout.splitlines() if f.endswith(".py") and Path(f).exists()]
    return files

def format_files(files):
    """Format Python files with Ruff."""
    print(f"{Colors.BLUE}[1/3] Running Ruff format...{Colors.END}")
    
    stdout, stderr, returncode = run_command(
        ["ruff", "format"] + files,
        capture=False
    )
    
    if returncode == 0:
        print(f"{Colors.GREEN}✓ Formatting complete{Colors.END}\n")
        return True
    else:
        print(f"{Colors.RED}✗ Formatting failed{Colors.END}\n")
        if stderr:
            print(stderr)
        return False

def check_files(files):
    """Check Python files with Ruff linter."""
    print(f"{Colors.BLUE}[2/3] Running Ruff check...{Colors.END}")
    
    stdout, stderr, returncode = run_command([
        "ruff", "check", "--output-format=full"
    ] + files)
    
    if returncode == 0:
        print(f"{Colors.GREEN}✓ No linting issues found{Colors.END}\n")
        return True
    else:
        print(f"{Colors.RED}✗ Linting issues found:{Colors.END}\n")
        print(stdout)
        if stderr:
            print(stderr)
        return False

def restage_files(files):
    """Re-stage modified files after formatting."""
    print(f"{Colors.BLUE}[3/3] Re-staging formatted files...{Colors.END}")
    
    stdout, stderr, returncode = run_command(
        ["git", "add"] + files,
        capture=False
    )
    
    if returncode == 0:
        print(f"{Colors.GREEN}✓ Files re-staged{Colors.END}\n")
        return True
    else:
        print(f"{Colors.RED}✗ Failed to re-stage files{Colors.END}\n")
        return False

def main():
    """Main function to orchestrate the pre-commit checks."""
    print(f"\n{Colors.BOLD}=== Ruff Custom Pre-commit Hook ==={Colors.END}\n")
    
    # Get staged Python files
    staged_files = get_staged_python_files()
    
    if not staged_files:
        print("No Python files staged. Skipping checks.")
        sys.exit(0)
    
    print(f"Checking {len(staged_files)} Python file(s):")
    for file in staged_files:
        print(f"  • {file}")
    print()
    
    # Step 1: Format files
    if not format_files(staged_files):
        print(f"{Colors.RED}❌ Pre-commit hook failed at formatting stage{Colors.END}")
        sys.exit(1)
    
    # Step 2: Check files
    if not check_files(staged_files):
        print(f"{Colors.RED}❌ Pre-commit hook failed at linting stage{Colors.END}")
        print(f"\n{Colors.YELLOW}Fix the issues above and try again.{Colors.END}")
        print(f"{Colors.YELLOW}To bypass (not recommended): git commit --no-verify{Colors.END}")
        sys.exit(1)
    
    # Step 3: Re-stage formatted files
    if not restage_files(staged_files):
        print(f"{Colors.RED}❌ Failed to re-stage files{Colors.END}")
        sys.exit(1)
    
    print(f"{Colors.GREEN}{Colors.BOLD}✅ All checks passed! Commit allowed.{Colors.END}\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

Make it executable:
```bash
chmod +x hooks/ruff_precommit.py
```

### Running Pre-commit Hooks

#### Automatic Execution

Once installed, pre-commit runs automatically on `git commit`:
```bash
git add .
