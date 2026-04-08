# Contributing to Jobrows

Thank you for your interest in contributing to **Jobrows**! 🎉

We're building an open, fair job platform — every contribution, big or small, helps us get there. This guide will walk you through everything you need to know to get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Request Process](#pull-request-process)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Commit Message Convention](#commit-message-convention)
- [Database Migrations](#database-migrations)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ETE-Digital.git
   cd ETE-Digital/ete-digital
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/coriuday/ETE-Digital.git
   ```
4. **Set up your development environment** (see [Development Setup](#development-setup))

---

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
- Check the [existing issues](https://github.com/coriuday/ETE-Digital/issues) to avoid duplicates
- Ensure the bug is reproducible on the latest version

When submitting, please include:
- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs. **actual behavior**
- **Environment details** (OS, Python version, Node.js version, browser)
- **Relevant logs** or screenshots

---

### Suggesting Features

We love new ideas! Before submitting:
- Check if the feature has already been requested in [existing issues](https://github.com/coriuday/ETE-Digital/issues)

When submitting a feature request, include:
- **Clear title** and description
- **The problem it solves** — why do we need this?
- **Proposed solution** with as much detail as possible
- **Alternatives considered**

---

### Your First Code Contribution

Unsure where to start? Look for issues labeled:

| Label | Description |
|-------|-------------|
| `good first issue` | Simple issues ideal for newcomers |
| `help wanted` | Issues where we need extra help |
| `bug` | Something isn't working correctly |
| `enhancement` | New feature or improvement |
| `documentation` | Improvements or additions to docs |

---

### Pull Request Process

1. **Sync with upstream** before starting:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes:
   git checkout -b fix/bug-description
   ```

3. **Make your changes** — follow [Code Style Guidelines](#code-style-guidelines), add tests, update docs.

4. **Commit** using [conventional commits](#commit-message-convention):
   ```bash
   git commit -m "feat(tryouts): add auto-grading rubric validation"
   ```

5. **Push and open a Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Use a clear, descriptive title
   - Reference related issues (e.g., `Closes #123`)
   - Add screenshots or recordings for UI changes

#### PR Requirements Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass locally (`pytest` and `npm run test`)
- [ ] New features have corresponding tests
- [ ] Documentation updated (if applicable)
- [ ] No `.env`, `__pycache__`, or build artifacts committed
- [ ] Branch is up to date with `main`

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose

### Backend

```bash
cd ete-digital/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env            # then edit .env

# Run migrations & start server
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd ete-digital/frontend
npm install
cp .env.example .env.local      # then edit .env.local
npm run dev
```

### Full Stack (Docker)

```bash
cd ete-digital/infra/docker
docker-compose up -d
```

---

## Code Style Guidelines

### Python (Backend)

We use **Black**, **flake8**, and **mypy**:

```bash
cd ete-digital/backend
black .
flake8 app/
mypy app/
```

Key practices:
- Use type hints on all functions
- Write `async` functions for all I/O operations
- Use Pydantic schemas for all request/response models
- Docstrings for all public functions and classes

```python
async def calculate_match_score(candidate: dict, job: dict) -> int:
    """
    Calculate match score between candidate and job.

    Args:
        candidate: Candidate profile dictionary
        job: Job requirements dictionary

    Returns:
        Match score (0-100)
    """
    ...
```

### TypeScript / React (Frontend)

We use **ESLint** and **TypeScript strict mode**:

```bash
cd ete-digital/frontend
npm run lint
npx tsc --noEmit
```

Key practices:
- Use functional components with hooks
- Use TypeScript strictly — avoid `any`
- Use Zustand for global state, React Query for server state
- Props documented with TypeScript interfaces

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => (
  <button className={`btn-${variant}`} onClick={onClick}>{children}</button>
);
```

---

## Testing

### Backend Tests

```bash
cd ete-digital/backend
pytest tests/ -v
pytest tests/ --cov=app --cov-report=html    # with coverage
```

We use `pytest` + `httpx` for async API testing. Aim for **80%+ coverage**.

### Frontend Tests

```bash
cd ete-digital/frontend
npm run test
npm run test:coverage
```

We use `vitest` + React Testing Library. Tests live alongside components in `*.test.tsx` files.

### Guidelines

- Write tests for all new features and bug fixes
- Test edge cases and error conditions
- Mock external services (database, storage, email) in unit tests

---

## Commit Message Convention

We use **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short description>
```

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting (no logic change) |
| `refactor` | Code restructuring |
| `test` | Adding or updating tests |
| `chore` | Build, deps, CI changes |
| `perf` | Performance improvements |

**Examples:**
```
feat(auth): add JWT refresh token rotation
fix(vault): resolve encryption key loading issue
docs(api): update tryout submission endpoint docs
test(jobs): add edge case tests for salary filter
```

**Breaking changes** — append `!` and add a `BREAKING CHANGE:` footer:
```
feat(auth)!: remove legacy token endpoint

BREAKING CHANGE: /api/auth/token is removed. Use /api/auth/login instead.
```

---

## Database Migrations

When making schema changes:

```bash
# Create migration
cd ete-digital/backend
alembic revision --autogenerate -m "Add new field to User"

# Review the generated file carefully, then test:
alembic upgrade head
alembic downgrade -1      # verify rollback works
alembic upgrade head      # re-apply

# Include the migration file in your PR
```

---

## Community

- **GitHub Issues** — Bug reports & feature requests
- **GitHub Discussions** — General questions and ideas
- **Email** — [support@jobrows.com](mailto:support@jobrows.com)

---

Thank you for helping make Jobrows better! 💙
