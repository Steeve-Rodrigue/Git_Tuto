#### Manual Execution

Run on all files:
```bash
pre-commit run --all-files
```

Run on specific files:
```bash
pre-commit run --files src/main.py src/utils.py
```

Run a specific hook:
```bash
pre-commit run ruff-format --all-files
```

#### Updating Hooks

Update all hooks to latest versions:
```bash
pre-commit autoupdate
```

This updates the `rev` values in `.pre-commit-config.yaml`.

#### Bypassing Hooks

Skip pre-commit hooks (not recommended):
```bash
git commit --no-verify -m "emergency fix"
```

### Example Output

**Successful commit:**
```bash
$ git commit -m "feat(auth): add user authentication"

Trim trailing whitespace...........................................Passed
Fix end of files...............................................Passed
Check YAML syntax..............................................Passed
Check for large files..........................................Passed
Check for merge conflicts......................................Passed
Detect private keys............................................Passed
Format Python code with Ruff...................................Passed
Lint Python code with Ruff.....................................Passed

=== Ruff Custom Pre-commit Hook ===

Checking 3 Python file(s):
  • src/auth.py
  • src/models.py
  • tests/test_auth.py

[1/3] Running Ruff format...
✓ Formatting complete

[2/3] Running Ruff check...
✓ No linting issues found

[3/3] Re-staging formatted files...
✓ Files re-staged

✅ All checks passed! Commit allowed.

[main abc1234] feat(auth): add user authentication
 3 files changed, 150 insertions(+), 20 deletions(-)
```

**Failed commit:**
```bash
$ git commit -m "fix: resolve bug"

Trim trailing whitespace...........................................Passed
Fix end of files...............................................Passed
Format Python code with Ruff...................................Failed
- hook id: ruff-format
- files were modified by this hook

1 file reformatted

Lint Python code with Ruff.....................................Failed
- hook id: ruff
- exit code: 1

src/utils.py:15:1: F401 [*] `os` imported but unused
src/utils.py:23:5: E501 Line too long (95 > 88 characters)

Found 2 errors.
[*] 1 fixable with the `--fix` option.

=== Ruff Custom Pre-commit Hook ===

Checking 1 Python file(s):
  • src/utils.py

[1/3] Running Ruff format...
✓ Formatting complete

[2/3] Running Ruff check...
✗ Linting issues found:

src/utils.py:15:1: F401 [*] `os` imported but unused

❌ Pre-commit hook failed at linting stage

Fix the issues above and try again.
To bypass (not recommended): git commit --no-verify
```

### Pre-commit Configuration Reference

#### Common Configuration Options
```yaml
# .pre-commit-config.yaml

# Minimum pre-commit version required
minimum_pre_commit_version: '3.0.0'

# Default language version for hooks
default_language_version:
  python: python3.11
  node: '18.0.0'

# Default stages for all hooks (can be overridden per hook)
default_stages: [commit, push]

# Stop running hooks after first failure
fail_fast: false

# Repositories and hooks
repos:
  - repo: https://github.com/example/hooks
    rev: v1.0.0
    hooks:
      - id: example-hook
        # Hook-specific settings
        name: Custom Hook Name
        entry: ./scripts/custom_hook.sh
        language: script
        files: \.py$  # Regex pattern for files
        exclude: ^tests/  # Regex pattern to exclude
        types: [python]  # File types to run on
        types_or: [python, pyi]  # OR condition for types
        exclude_types: [markdown]
        pass_filenames: true  # Pass filenames as arguments
        require_serial: true  # Run serially, not in parallel
        stages: [commit, push, manual]
        always_run: false  # Run even if no files match
        verbose: true  # Show command output
        args: ['--config=.config.yaml']
```

#### File Type Filters

Common file types you can filter on:

- `python` - Python files (.py)
- `javascript` - JavaScript files (.js)
- `json` - JSON files
- `yaml` - YAML files
- `markdown` - Markdown files
- `text` - Text files
- `file` - Any file (default)

---

## Complete Code Examples

### Full Project Setup Example

Here's a complete example of setting up pre-commit in a Python project:

**Project structure:**
