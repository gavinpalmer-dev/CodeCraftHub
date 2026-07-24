# Testing Guide

This project uses Jest and Supertest for integration tests that exercise the API endpoints.

Running tests

```bash
npm install
npm test
```

What the tests cover

- Basic sanity check for the root route (`GET /`).
- Validation errors for creating/updating courses.
- Full create → read → update → delete lifecycle.
- Error cases: invalid IDs and invalid JSON payloads.

Test isolation

Tests use a temporary `test-courses.json` file located in the `tests/` folder. The application can be pointed at a different data file using the `CODECRAFTHUB_DATA_FILE` environment variable.

If you want to run a single test file with Jest:

```bash
npx jest tests/app.test.js
```
