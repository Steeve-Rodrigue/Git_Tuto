# Complete Git Hooks Tutorial - Part 3

## Table of Contents

1. [Method 2: Pre-commit Framework (Hybrid Approach)](#method-2-pre-commit-framework-hybrid-approach)
   - [Why Pre-commit Framework](#why-pre-commit-framework)
   - [Installation](#installation)
   - [Basic Configuration](#basic-configuration)
   - [Hybrid Method: Remote + Local Hooks](#hybrid-method-remote--local-hooks)
   - [Common Use Cases](#common-use-cases)
   - [Commands Reference](#commands-reference)

---

## Method 2: Pre-commit Framework (Hybrid Approach)

The pre-commit framework is a Python-based tool that manages Git hooks through a **version-controlled configuration file**. It supports both **remote hooks** (maintained by others) and **local custom hooks** (your own scripts).

### Why Pre-commit Framework?

**Advantages over Local Hooks:**

| Feature | Local Hooks | Pre-commit Framework |
|---------|-------------|---------------------|
| Version controlled | ❌ No | ✅ Yes (`.pre-commit-config.yaml`) |
| Team sharing | ❌ Manual | ✅ Automatic |
| Updates | ❌ Manual | ✅ `pre-commit autoupdate` |
| Hook ecosystem | ❌ Build yourself | ✅ Thousands available |
| Setup | Manual copy | ✅ `pre-commit install` |

**The Hybrid Advantage:**
- Use **remote hooks** for standard tools (Ruff, Black, ESLint)
- Add **local hooks** for custom project-specific checks
- Both managed in one configuration file

---

### Installation

#### Step 1: Install Pre-commit
```bash
# Using pip
pip install pre-commit

# Using pipx (recommended - isolated)
pipx install pre-commit

# Using Homebrew (macOS)
brew install pre-commit

# Verify installation
pre-commit --version
```

#### Step 2: Install Git Hooks
```bash
# Navigate to your repository
cd /path/to/your/repository

# Install pre-commit hook
pre-commit install

# Output:
# pre-commit installed at .git/hooks/pre-commit
```

#### Step 3: Install Additional Hook Types (Optional)
```bash
# Install commit-msg hook
pre-commit install --hook-type commit-msg

# Install pre-push hook
pre-commit install --hook-type pre-push
```

---

### Basic Configuration

Create `.pre-commit-config.yaml` in your repository root:
```yaml
# .pre-commit-config.yaml

repos:
  # Remote hook: Use third-party maintained hooks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

**Configuration Breakdown:**

- `repos`: List of hook repositories
- `repo`: URL of the hook repository
- `rev`: Version/tag to use (use `pre-commit autoupdate` to update)
- `hooks`: List of hooks to run from that repository
- `id`: Hook identifier

---

### Hybrid Method: Remote + Local Hooks

Combine remote maintained hooks with your custom local scripts for maximum flexibility.

#### Configuration Example
```yaml
# .pre-commit-config.yaml

repos:
  # -------------------------------------
  # Remote Hooks: Maintained by community
  # -------------------------------------
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.14
    hooks:
      - id: ruff-format    # Auto-format code
      - id: ruff-check     # Check code and block if unfixable errors

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: detect-private-key

  # -------------------------------------
  # Local Hooks: Your custom scripts
  # -------------------------------------
  - repo: local
    hooks:
      - id: ruff-custom-msg
        name: Ruff Custom Messages
        entry: python hooks/ruff_custom.py
        language: system
        types: [python]
        
      - id: custom-checks
        name: Project-Specific Checks
        entry: python hooks/custom_checks.py
        language: system
        types: [python]
        pass_filenames: true
```

#### Local Hook Script: Custom Ruff Messages

Create `hooks/ruff_custom.py`:
```python
#!/usr/bin/env python3
# hooks/ruff_custom.py

import subprocess
import sys

print("=== Custom Hook: Ruff Messages ===")

# Get staged Python files
try:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=d"],
        capture_output=True, text=True, check=True
    )
except subprocess.CalledProcessError:
    print("Unable to get staged files.")
    sys.exit(1)

files = [f for f in result.stdout.splitlines() if f.endswith(".py")]

if not files:
    print("No Python files to check.")
    sys.exit(0)

print(f"Analyzing: {', '.join(files)}")

# Run Ruff check
check_cmd = ["ruff", "check"] + files
check_res = subprocess.run(check_cmd)

if check_res.returncode != 0:
    print("\n⚠ Commit blocked: Ruff found errors requiring manual fixes.")
    print("Fix the errors or run 'ruff format' on the files.")
    sys.exit(1)

print("\n✅ All Ruff checks passed. Commit allowed.")
sys.exit(0)
```

Make it executable:
```bash
chmod +x hooks/ruff_custom.py
```

#### Project Structure
```
my-project/
├── .git/
├── .pre-commit-config.yaml    # Pre-commit configuration
├── hooks/                      # Local custom hooks
│   ├── ruff_custom.py
│   └── custom_checks.py
├── src/
│   └── main.py
└── README.md
```

---

### Common Use Cases

#### Use Case 1: Python Project with Ruff
```yaml
# .pre-commit-config.yaml

repos:
  # Remote: Ruff for formatting and linting
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.14
    hooks:
      - id: ruff-format
      - id: ruff
        args: ['--fix']

  # Local: Custom validation
  - repo: local
    hooks:
      - id: check-docstrings
        name: Check Docstrings
        entry: python hooks/check_docs.py
        language: system
        types: [python]
```

#### Use Case 2: Multi-Language Project
```yaml
# .pre-commit-config.yaml

repos:
  # Python
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.14
    hooks:
      - id: ruff-format
      - id: ruff

  # JavaScript
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v9.0.0
    hooks:
      - id: eslint
        args: ['--fix']

  # YAML/JSON
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-yaml
      - id: check-json

  # Local: Project rules
  - repo: local
    hooks:
      - id: no-console-log
        name: Block console.log
        entry: bash -c 'git diff --cached | grep -E "console\\.log" && exit 1 || exit 0'
        language: system
```

#### Use Case 3: Security-Focused Setup
```yaml
# .pre-commit-config.yaml

repos:
  # Code quality
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.14.14
    hooks:
      - id: ruff-format
      - id: ruff

  # Security scanning
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        args: ['-ll', '-i']

  # Secret detection
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: detect-private-key

  # Local: Custom security checks
  - repo: local
    hooks:
      - id: check-secrets
        name: Check for Hardcoded Secrets
        entry: python hooks/check_secrets.py
        language: system
        types: [python]
```

---

### Hook Configuration Options

#### Common Hook Parameters
```yaml
- repo: local
  hooks:
    - id: my-hook
      name: Display Name
      entry: python hooks/script.py        # Command to run
      language: system                     # Language type
      types: [python]                      # File types
      files: \.py$                         # Regex pattern
      exclude: ^tests/                     # Exclude pattern
      pass_filenames: true                 # Pass filenames as args
      args: ['--config', 'setup.cfg']      # Additional arguments
      stages: [commit, push]               # When to run
      always_run: false                    # Run even if no files match
      verbose: true                        # Show output
```

#### File Type Filters
```yaml
types: [python]           # Python files
types: [javascript]       # JavaScript files
types: [json]            # JSON files
types: [yaml]            # YAML files
types: [markdown]        # Markdown files
types_or: [python, pyi]  # Python OR stub files
```

#### Stages
```yaml
stages: [commit]              # Only on commit (default)
stages: [push]                # Only on push
stages: [commit, push]        # Both commit and push
stages: [manual]              # Only when run manually
```

---

### Commands Reference

#### Essential Commands
```bash
# Install hooks
pre-commit install

# Run manually on all files
pre-commit run --all-files

# Run on specific files
pre-commit run --files file1.py file2.py

# Run specific hook
pre-commit run ruff-format --all-files

# Update hooks to latest versions
pre-commit autoupdate

# Uninstall hooks
pre-commit uninstall
```

#### Testing and Debugging
```bash
# Test configuration
pre-commit run --all-files --verbose

# Run without modifying files
pre-commit run --all-files --show-diff-on-failure

# Skip a specific hook
SKIP=ruff-format git commit -m "message"

# Skip all hooks
git commit --no-verify -m "message"
```

#### Configuration Management
```bash
# Validate config file
pre-commit validate-config

# Show installed hooks
pre-commit run --all-files --verbose

# Clean cache
pre-commit clean
```

---

### Workflow Examples

#### First-Time Setup
```bash
# 1. Install pre-commit
pip install pre-commit

# 2. Create config file
touch .pre-commit-config.yaml

# 3. Add hooks (edit .pre-commit-config.yaml)
# ... add your configuration ...

# 4. Install git hooks
pre-commit install

# 5. Run on all existing files
pre-commit run --all-files
```

#### Daily Usage
```bash
# Hooks run automatically on commit
git add .
git commit -m "feat: add new feature"

# Output:
# Ruff format...........................Passed
# Ruff check............................Passed
# Custom checks.........................Passed
# [main abc1234] feat: add new feature
```

#### Updating Hooks
```bash
# Update all hooks to latest versions
pre-commit autoupdate

# Output:
# Updating https://github.com/astral-sh/ruff-pre-commit ... updating v0.14.14 -> v0.15.0
# Updating https://github.com/pre-commit/pre-commit-hooks ... already up to date

# Commit the updated config
git add .pre-commit-config.yaml
git commit -m "chore: update pre-commit hooks"
```

---

### Execution Output Examples

#### Successful Run
```bash
$ git commit -m "feat: add authentication"

Trim trailing whitespace...................Passed
Fix end of files...........................Passed
Check YAML.................................Passed
Ruff format................................Passed
Ruff check.................................Passed
Custom checks..............................Passed

[main abc1234] feat: add authentication
 2 files changed, 50 insertions(+)
```

#### Failed Run
```bash
$ git commit -m "feat: add feature"

Trim trailing whitespace...................Passed
Ruff format................................Failed
- hook id: ruff-format
- files were modified by this hook

1 file reformatted

Ruff check.................................Failed
- hook id: ruff
- exit code: 1

src/main.py:15:1: F401 'os' imported but unused

=== Custom Hook: Ruff Messages ===
Analyzing: src/main.py

⚠ Commit blocked: Ruff found errors requiring manual fixes.
Fix the errors or run 'ruff format' on the files.
```

---

### Advanced: CI/CD Integration

Use the same hooks in CI/CD:
```yaml
# .github/workflows/pre-commit.yml

name: Pre-commit

on: [push, pull_request]

jobs:
  pre-commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run pre-commit
        uses: pre-commit/action@v3.0.0
```

---

### Comparison: Methods Summary

| Aspect | Local Hooks | Pre-commit (Remote) | Pre-commit (Hybrid) |
|--------|-------------|---------------------|---------------------|
| **Setup** | Manual | Simple config | Simple config |
| **Sharing** | Manual copy | Auto via config | Auto via config |
| **Updates** | Manual | `autoupdate` | `autoupdate` |
| **Customization** | Full control | Limited | ✅ Best of both |
| **Maintenance** | High | Low | Low |
| **Flexibility** | High | Medium | ✅ High |

---

**Next**: Part 4 will cover complete real-world examples and troubleshooting.
