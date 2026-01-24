**Complete `.pre-commit-config.yaml`:**
```yaml
# .pre-commit-config.yaml

minimum_pre_commit_version: '3.0.0'

default_language_version:
  python: python3.11

default_stages: [commit]

repos:
  # General file checks
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
        name: Remove trailing whitespace
      - id: end-of-file-fixer
        name: Ensure files end with newline
      - id: check-yaml
        name: Validate YAML files
      - id: check-toml
        name: Validate TOML files
      - id: check-json
        name: Validate JSON files
      - id: check-added-large-files
        name: Prevent large files (>500KB)
        args: ['--maxkb=500']
      - id: check-merge-conflict
        name: Detect merge conflict markers
      - id: detect-private-key
        name: Detect private keys
      - id: mixed-line-ending
        name: Normalize line endings
        args: ['--fix=lf']
      - id: check-case-conflict
        name: Check for case-conflicting filenames

  # Python formatting and linting
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.14
    hooks:
      - id: ruff-format
        name: Format code with Ruff
        
      - id: ruff
        name: Lint code with Ruff
        args:
          - '--fix'
          - '--exit-non-zero-on-fix'
          - '--ignore=E501'  # Ignore line length (handled by formatter)

  # Security checks
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        name: Security linting with Bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ['bandit[toml]']

  # Type checking (optional)
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        name: Type checking with mypy
        additional_dependencies: [types-all]
        args:
          - '--ignore-missing-imports'
          - '--check-untyped-defs'

  # Local custom hooks
  - repo: local
    hooks:
      - id: ruff-custom
        name: Custom Ruff Pre-commit
        entry: python hooks/ruff_precommit.py
        language: system
        types: [python]
        pass_filenames: false
        
      - id: custom-checks
        name: Custom Quality Checks
        entry: python hooks/custom_checks.py
        language: system
        types: [python]
        pass_filenames: true
        
      - id: unittest
        name: Run Unit Tests
        entry: pytest tests/ -v --tb=short -x
        language: system
        types: [python]
        pass_filenames: false
        stages: [push]  # Only run on push
```

**Installation and usage:**
```bash
# 1. Install pre-commit
pip install pre-commit

# 2. Install git hooks
pre-commit install
pre-commit install --hook-type commit-msg
pre-commit install --hook-type pre-push

# 3. Run manually on all files (first time)
pre-commit run --all-files

# 4. Normal git workflow (hooks run automatically)
git add .
git commit -m "feat: add new feature"

# 5. Update hooks to latest versions
pre-commit autoupdate
```

### Comparison: Local vs Pre-commit Framework

| Feature | Local Hooks | Pre-commit Framework |
|---------|-------------|---------------------|
| **Version Control** | ❌ Not tracked | ✅ Tracked in `.pre-commit-config.yaml` |
| **Team Sharing** | ❌ Manual distribution | ✅ Automatic via repo |
| **Setup Complexity** | Medium (manual scripting) | Low (use existing hooks) |
| **Updates** | ❌ Manual | ✅ `pre-commit autoupdate` |
| **Ecosystem** | Limited to your scripts | ✅ Thousands of hooks available |
| **Language Support** | Depends on your scripts | ✅ Multi-language |
| **Testing** | Manual | ✅ `pre-commit run` |
| **Maintenance** | High | Low |
| **Flexibility** | ✅ Full control | ✅ Can use local hooks too |
| **Best For** | Personal projects | Team projects |

### Recommended Workflow

**For personal projects:**
- Start with local hooks if you need simple, custom logic
- Migrate to pre-commit framework as complexity grows

**For team projects:**
- Always use pre-commit framework
- Add custom local hooks in `.pre-commit-config.yaml` when needed
- Commit `.pre-commit-config.yaml` to version control
- Document hook installation in README.md

### Troubleshooting

#### Hook Not Executing

**Problem:** Hook script doesn't run when committing

**Solution:**
```bash
# For local hooks
chmod +x .git/hooks/pre-commit

# For pre-commit framework
pre-commit install
```

#### Pre-commit Command Not Found

**Problem:** `pre-commit: command not found`

**Solution:**
```bash
# Install pre-commit
pip install pre-commit

# Or with pipx
pipx install pre-commit

# Verify installation
pre-commit --version
```

#### Hooks Fail on Windows

**Problem:** Bash scripts fail on Windows

**Solution:**
- Use Python scripts instead of Bash (more portable)
- Or install Git Bash / WSL on Windows
- For pre-commit framework, most hooks work cross-platform

#### Files Not Detected

**Problem:** Hook doesn't process staged files

**Solution:**
```bash
# Check what files are staged
git diff --cached --name-only

# For pre-commit, ensure correct file types
types: [python]  # In .pre-commit-config.yaml
```

#### Hook Runs Too Slowly

**Problem:** Commits take too long

**Solution:**
```bash
# Run hooks in parallel (pre-commit does this by default)
# Or exclude slow checks from commit stage:
stages: [push]  # Run on push instead

# Skip hooks when needed (not recommended)
git commit --no-verify
```

#### Conflicts with CI/CD

**Problem:** Hooks pass locally but CI fails

**Solution:**
- Ensure hooks use same rules as CI
- Run same linters/formatters in both
- Use `.pre-commit-config.yaml` in CI too:
```bash
# In CI workflow
pre-commit run --all-files
```

#### Can't Update Hooks

**Problem:** `pre-commit autoupdate` fails

**Solution:**
```bash
# Clear cache
pre-commit clean

# Update manually
pre-commit autoupdate

# Or edit .pre-commit-config.yaml and update rev: values
```

---

This tutorial covers both local Git hooks and the pre-commit framework comprehensively. For most projects, especially team projects, the pre-commit framework is recommended due to its ease of sharing, updating, and maintaining hooks across the team.
