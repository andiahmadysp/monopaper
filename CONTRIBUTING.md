# Contributing to monopaper

Thank you for your interest in contributing to **monopaper**! We want to make contributing to this project as easy and transparent as possible.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and welcoming environment for everyone.

## How Can I Contribute?

### 1. Reporting Bugs
- Search existing issues to ensure the bug hasn't already been reported.
- Open a new issue with a clear title, description, steps to reproduce, and screenshots if applicable.

### 2. Suggesting Enhancements
- Open an issue describing the feature you'd like to see, along with the use-case or user benefit.

### 3. Submitting Pull Requests
- Fork the repository and create your branch from `main`.
- Install dependencies and ensure your local environment is running correctly.
- Implement your changes, keeping coding standards in mind.
- Write tests or verify that existing tests pass using `php artisan test` and `npx tsc --noEmit`.
- Commit your changes with descriptive commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g. `feat: add markdown export support`).
- Submit a Pull Request.

---

## Coding Standards & Guidelines

### Frontend (React & TypeScript)
- **Separation of Concerns:** Keep components modular. Separate heavy helpers or calculation logic into helper modules or hooks under `resources/js/utils/` or `resources/js/hooks/`.
- **Typing:** Ensure TypeScript compilation passes with zero warnings or errors (`npx tsc --noEmit`). Do not use `any` unless absolutely necessary.
- **Styling:** Use CSS variables defined in our theme layer for visual consistency.

### Backend (Laravel)
- **Service Pattern:** Controller actions should be extremely slim. Business logic, transactions, reordering algorithms, and cache invalidation should reside in Service classes under `app/Services/`.
- **Database Transactions:** Always wrap operations that modify multiple database records in `DB::transaction()`.
- **Testing:** Include unit/feature tests for any new endpoints or logic.
