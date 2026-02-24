# Contributing to ETE Digital

Thank you for your interest in contributing to ETE Digital! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Python/Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** and motivation
- **Proposed solution** (if you have one)
- **Alternative solutions** considered

### Pull Requests

1. **Fork the repository and create your branch from `develop`**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding style guidelines below
   - Add tests for your changes
   - Update documentation as needed

3. **Ensure tests pass**

   ```bash
   # Backend
   cd backend && pytest tests/
   
   # Frontend
   cd frontend && npm run test
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Follow conventional commits format: `type(scope): description`
   - Types: feat, fix, docs, style, refactor, test, chore

5. **Push to your fork and submit a pull request**

## Development Setup

See [README.md](README.md#development) for detailed setup instructions.

## Coding Style

### Backend (Python)

- Follow **PEP 8** style guide
- Use **type hints** for function signatures
- Format code with **Black** (line length: 100)
- Sort imports with **isort**
- Docstrings for all public functions/classes

```python
def calculate_match_score(candidate: dict, job: dict) -> int:
    """
    Calculate match score between candidate and job.
    
    Args:
        candidate: Candidate profile dictionary
        job: Job requirements dictionary
        
    Returns:
        Match score (0-100)
    """
    pass
```

### Frontend (TypeScript/React)

- Follow **Airbnb React Style Guide**
- Use **TypeScript** for type safety
- Format code with **Prettier**
- Use **functional components** and hooks
- Props documented with TypeScript interfaces

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  return <button className={`btn-${variant}`} onClick={onClick}>{children}</button>;
};
```

## Testing Guidelines

### Backend Tests

- Unit tests for all services and utilities
- Integration tests for API endpoints
- Minimum **80% code coverage**
- Use **pytest fixtures** for test data

```python
def test_create_user(db_session):
    user = create_user(email="test@example.com", role=UserRole.CANDIDATE)
    assert user.email == "test@example.com"
    assert user.is_verified is False
```

### Frontend Tests

- Component tests with React Testing Library
- Unit tests for utilities and hooks
- Minimum **80% code coverage**

```tsx
it('renders login button', () => {
  render(<LoginPage />);
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
```

## Database Migrations

When making database changes:

1. Create migration

   ```bash
   cd backend
   alembic revision --autogenerate -m "Add new field to User"
   ```

2. Review generated migration carefully
3. Test migration up and down

   ```bash
   alembic upgrade head
   alembic downgrade -1
   ```

4. Include migration in your PR

## Documentation

- Update README if adding new features
- Add docstrings/comments for complex logic
- Update API documentation (OpenAPI spec)
- Create/update architecture diagrams if needed

## Review Process

1. **Automated checks must pass**
   - CI pipeline (tests, linting, security)
   - No merge conflicts

2. **Code review by maintainers**
   - At least one approval required
   - Address all review comments

3. **Merge**
   - Squash and merge to keep history clean
   - Delete branch after merge

## Release Process

- We follow [Semantic Versioning](https://semver.org/)
- Releases are created from `main` branch
- Changelog updated for each release

## Questions?

- Open a [discussion](https://github.com/yourusername/ete-digital/discussions)
- Join our community chat (link TBD)

Thank you for contributing! 🚀
