# Removing a Secret from a Git Repository
## Approach 1 — `git filter-repo`

---

## The Problem

A `.env` file containing production secrets was accidentally committed to the git history. The polluted commit is not the latest one — there are more recent commits stacked on top of it, with real work we don't want to lose.

The simulated repository had the following history:

| Hash | Commit | Status |
|---|---|---|
| `528c1ec` | Add order endpoints | HEAD — clean |
| `f87d438` | Add product endpoints | clean |
| `966c4be` | Add environment config and database connection | ⚠️ **POLLUTED** — contains `.env` |
| `5b65117` | Add user authentication | clean |
| `d41635a` | Initial commit | clean |

The secrets exposed in the `.env` file were:

```
DB_PASSWORD=s3cr3tP@ss!_do_not_share
JWT_SECRET=super_secret_jwt_key_1234
REDIS_URL=redis://:r3d1sP@ss@cache.internal:6379
```

---

## Why `git rm` Is Not Enough

The natural instinct when realizing a secret was committed is to delete the file and commit the deletion:

```bash
git rm .env
git commit -m "remove .env"
```

This approach is **insufficient**. Git stores history as a chain of immutable objects. A new commit that deletes `.env` does not erase the commit that created it — it simply adds a new entry on top.

The secret remains fully accessible with a single command by anyone with access to the repo:

```bash
git show 966c4be:.env
```

> ⚠️ Even a private repo is vulnerable. Any collaborator, CI/CD service, or tool that has cloned the repo can read the secret from history.

---

## The 7 Steps

| Step | Action | Key Command |
|---|---|---|
| 1 | Identify the polluted commit | `git log --all --full-history -- .env` |
| 2 | Prove that `git rm` is not enough | `git show <hash>:.env` |
| 3 | Install `git-filter-repo` | `pip install git-filter-repo` |
| 4 | Purge `.env` from the entire history | `git filter-repo --path .env --invert-paths --force` |
| 5 | Verify the secret is gone | `git cat-file -e <old-hash>` |
| 6 | Add `.gitignore` and `.env.example` | `git add .gitignore .env.example` |
| 7 | Force push to the remote | `git push origin --force --all` |

---

## Step by Step

### Step 1 — Identify the Polluted Commit

Before touching anything, map out the problem. The following command searches across all branches and the entire history for commits that touched `.env`:

```bash
git log --all --full-history -- .env
```

The `--` separator is critical — it tells git explicitly that `.env` is a file path, not a branch name. Without it, git may interpret the argument differently and miss commits.

Once the hash is identified, inspect the exact content of the commit:

```bash
git show <hash>
```

---

### Step 2 — Understand Why `git rm` Fails

Delete the file via `git rm` and prove the secret is still accessible from the old commit:

```bash
git show <hash>:.env
```

This step is educational — it justifies why a history rewrite is the only real solution.

---

### Step 3 — Install `git-filter-repo`

`git filter-repo` is the tool officially recommended by GitHub and GitLab since 2019, replacing the older `git filter-branch`.

Advantages:
- Extremely fast even on large repositories
- Physically removes git objects — no residual references in the reflog
- Clean interface with powerful options

```bash
pip install git-filter-repo     # Ubuntu / Debian / Windows
brew install git-filter-repo    # macOS
```

---

### Step 4 — Run `git filter-repo`

The core command of the entire operation:

```bash
git filter-repo --path .env --invert-paths --force
```

Flag breakdown:

| Flag | Role |
|---|---|
| `--path .env` | Targets the `.env` file specifically |
| `--invert-paths` | Inverts the selection — removes `.env`, keeps everything else |
| `--force` | Allows execution without a configured remote |

**What happens commit by commit:** `git filter-repo` rebuilds the entire commit chain from the beginning. For each commit containing `.env`, it reconstructs it without that file. All subsequent commits receive new hashes because their parent changed.

> ⚠️ Commits before the polluted commit keep their original hash. Commits at and after the polluted commit all get new hashes in cascade.

**Other ways to target files:**

```bash
# Target an entire folder
git filter-repo --path secrets/ --invert-paths

# Glob pattern — all .env files in all subdirectories
git filter-repo --path-glob '**/.env' --invert-paths

# Regex pattern
git filter-repo --path-regex '(secret|password)' --invert-paths

# Replace a value inside file content (if the secret is hardcoded in a source file)
git filter-repo --replace-text expressions.txt
```

With `expressions.txt`:
```
s3cr3tP@ss!_do_not_share==>REDACTED
super_secret_jwt_key_1234==>REDACTED
```

---

### Step 5 — Verify the Secret Is Gone

Verify at multiple levels to make sure the purge is complete.

**Check 1** — no commit references `.env` anymore:
```bash
git log --oneline --all --full-history -- .env
# expected: empty output
```

**Check 2** — the old git object no longer exists in the store:
```bash
git cat-file -e <old-hash>
# expected: fatal: Not a valid object name
```

**Check 3** — the secret string is not found in any git object:
```bash
git grep "s3cr3tP@ss" $(git rev-list --all)
# expected: no output
```

**Check 4** — the rewritten commit still exists but without `.env`:
```bash
git show <new-hash> --name-only
# expected: only src/db.js listed, no .env
```

---

### Step 6 — Add `.gitignore` and `.env.example`

The purge is done but without prevention the problem can happen again.

**.gitignore:**
```
# Secrets — never commit these
.env
.env.*
!.env.example

# Dependencies
node_modules/

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

The `!` before `.env.example` is an exception — it overrides the `.env.*` rule for that specific file, allowing it to be committed despite the general rule.

**.env.example:**
```
# Copy this file to .env and fill in real values
# NEVER commit .env — only commit this template

NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PASSWORD=your_db_password_here
JWT_SECRET=generate_a_random_string_here
REDIS_URL=redis://localhost:6379
```

---

### Step 7 — Force Push

`git filter-repo` only rewrites the local repository. To synchronize the remote, a force push is mandatory:

```bash
git push origin --force --all
git push origin --force --tags
```

`--tags` matters because tags can point to old commits that contain the secret.

**Safer alternative when working in a team:**

```bash
git push origin --force-with-lease
```

`--force-with-lease` checks that nobody else has pushed in the meantime before overwriting. If a colleague has pushed, the operation is rejected — you won't accidentally overwrite their work.

> ⚠️ After the force push, all collaborators must re-clone the repository. A simple `git pull` will not work — their local histories are now diverged.

---

## Revoking the Exposed Secrets

Cleaning git is not enough. The secret must be considered compromised the moment it touched a remote. Revocation should happen in parallel — ideally before even running `git filter-repo`.

| Secret | Action | Effect |
|---|---|---|
| `DB_PASSWORD` | Change the password in the database | The old password becomes invalid immediately |
| `JWT_SECRET` | Generate a new key and redeploy | All existing tokens signed with the old key are invalidated |
| `REDIS_URL / password` | Change the Redis password on the server | The old connection URL no longer works |
| LLM API key (OpenAI, Anthropic...) | Revoke on the provider's platform | Any request using the old key returns 401 immediately |

> ⚠️ A key that has touched a git repository — even a private one, even for a second — must be considered compromised. Never keep it. Always revoke and regenerate.

---

## Key Takeaways

### On `git filter-repo`
- `--path` selects a file, `--invert-paths` flips the selection into an exclusion
- You can target by exact path, glob (`**/.env`), regex, or replace content with `--replace-text`
- Commits before the polluted commit keep their original hash. Commits at and after it get new hashes in cascade
- Deleted git objects are physically removed from the object store — no residuals in the reflog

### On Security
- Deleting a file with `git rm` does not erase the secret from history
- The secret remains readable via `git show <hash>:.env` even after deletion
- A private repo is not safe — any collaborator or CI/CD service can read the history
- After a force push, check the GitHub/GitLab cache — platforms may keep old objects cached for a few hours
- Existing forks still hold the old history — contact their owners

### On Prevention
- `.gitignore` with `.env` and `!.env.example` should be the first thing created in any new project
- `.env.example` with placeholder values is the industry standard for documenting expected variables
- Tools like `git-secrets` or `truffleHog` as pre-commit hooks catch secrets before they ever reach the remote
- API keys should have a short lifespan — the shorter the lifespan, the smaller the exposure window in case of a leak

---

*— End of document —*