# E2E Tests with Playwright

Sprint 12 - US-112: Tests E2E en Web con Playwright

## Overview

Playwright E2E tests for the Horus web application. These tests cover critical user flows across multiple browsers (Chromium, Firefox, WebKit) and verify keyboard shortcuts functionality.

## Requirements

- Node.js 20+
- pnpm 8+
- Playwright browsers (installed automatically)

## Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm --filter @horus/web exec playwright install
```

## Running Tests

### Run all tests (all browsers)

```bash
cd apps/web
pnpm test:e2e
```

### Run specific browser

```bash
# Chromium (Chrome/Edge)
pnpm test:e2e:chromium

# Firefox
pnpm test:e2e:firefox

# WebKit (Safari)
pnpm test:e2e:webkit
```

### Run with UI Mode (interactive)

```bash
pnpm test:e2e:ui
```

### Run in headed mode (see browser)

```bash
pnpm test:e2e:headed
```

### Run specific test file

```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/habits.spec.ts --headed
npx playwright test e2e/keyboard-shortcuts.spec.ts --project=chromium
```

### View test report

```bash
pnpm test:e2e:report
```

## Test Structure

```
e2e/
├── auth.spec.ts                # Authentication flow tests
├── habits.spec.ts              # Habits CRUD and completion tests
├── tasks.spec.ts               # Tasks with checklist tests
├── keyboard-shortcuts.spec.ts  # Keyboard navigation tests
└── README.md                   # This file
```

## Test Coverage

### 1. Authentication Flow (`auth.spec.ts`)

- ✅ User registration with validation
- ✅ Login with valid/invalid credentials
- ✅ Password strength validation
- ✅ Password visibility toggle
- ✅ Logout functionality
- ✅ Remember me feature
- ✅ Password reset flow

**Total:** 11 test cases

---

### 2. Habits Flow (`habits.spec.ts`)

- ✅ Create CHECK habit
- ✅ Create NUMERIC habit with target/unit
- ✅ Form validation
- ✅ Mark habit as completed
- ✅ Update numeric habit progress
- ✅ Streak tracking
- ✅ View statistics and charts
- ✅ Completion calendar
- ✅ Filter by category and status
- ✅ Edit habit details
- ✅ Delete habit

**Total:** 13 test cases

---

### 3. Tasks Flow (`tasks.spec.ts`)

- ✅ Create task with checklist items
- ✅ Form validation
- ✅ Set reminders
- ✅ Mark task as completed
- ✅ Complete checklist items
- ✅ Filter by priority (HIGH/MEDIUM/LOW)
- ✅ Filter by category
- ✅ Filter by status (pending/completed)
- ✅ Sort by due date, priority, creation date
- ✅ Edit task details
- ✅ Update priority
- ✅ Delete task
- ✅ Search tasks by title

**Total:** 18 test cases

---

### 4. Keyboard Shortcuts (`keyboard-shortcuts.spec.ts`)

#### Navigation

- ✅ `j` - Navigate down in lists
- ✅ `k` - Navigate up in lists

#### Actions

- ✅ `Space` - Mark habit/task as completed
- ✅ `Enter` - Open detail view
- ✅ `Escape` - Close dialogs

#### Creation

- ✅ `n` - New habit/task/event

#### Editing

- ✅ `e` - Edit selected item
- ✅ `Delete` - Delete with confirmation

#### Search & Help

- ✅ `Ctrl+K` / `Cmd+K` - Open search/command palette
- ✅ `?` - Show keyboard shortcuts help

#### Tab Switching

- ✅ `1-5` - Switch between main tabs

#### Refresh

- ✅ `r` - Refresh current view

**Total:** 17 test cases

---

## **Grand Total: 59 test cases**

## Browser Support

Tests run on the following browsers:

| Browser       | Engine | Coverage                  |
| ------------- | ------ | ------------------------- |
| Chromium      | Blink  | Desktop + Mobile          |
| Firefox       | Gecko  | Desktop                   |
| WebKit        | WebKit | Desktop (Safari) + Mobile |
| Mobile Chrome | Blink  | Pixel 5 viewport          |
| Mobile Safari | WebKit | iPhone 12 viewport        |

## Test Data

Tests use the following demo credentials:

```
Email: demo@horus.com
Password: demo1234
```

**Note:** This user must exist in your backend for tests to work.

## Configuration

### `playwright.config.ts`

Key settings:

- **Timeout:** 30s per test
- **Retries:** 2 in CI, 0 locally
- **Workers:** 1 in CI, unlimited locally
- **Base URL:** http://localhost:5173
- **Screenshots:** On failure only
- **Videos:** On failure in CI
- **Trace:** On first retry

### Multi-Browser Testing

Tests run in parallel across all configured browsers:

```typescript
projects: [
  { name: 'chromium', use: devices['Desktop Chrome'] },
  { name: 'firefox', use: devices['Desktop Firefox'] },
  { name: 'webkit', use: devices['Desktop Safari'] },
  { name: 'Mobile Chrome', use: devices['Pixel 5'] },
  { name: 'Mobile Safari', use: devices['iPhone 12'] },
];
```

## CI/CD Integration

Tests run automatically on GitHub Actions:

- **Trigger:** Push/PR to `main` or `develop`
- **Condition:** Changes in `apps/web/**` or `packages/shared/**`
- **Strategy:** Matrix build (chromium, firefox, webkit)
- **Artifacts:** Screenshots and reports on failure
- **Report:** Published to GitHub Pages

See: `.github/workflows/web-e2e-tests.yml`

## Writing Tests

### Basic Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login or navigate
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.fill('[name="input"]', 'value');

    // Act
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors

   ```tsx
   <div data-testid="habit-card">
   ```

2. **Use semantic selectors** when possible

   ```typescript
   page.locator('role=button[name="Submit"]');
   ```

3. **Wait for elements properly**

   ```typescript
   await expect(page.locator('text=Done')).toBeVisible();
   ```

4. **Avoid hard-coded waits**

   ```typescript
   // ❌ Bad
   await page.waitForTimeout(5000);

   // ✅ Good
   await expect(element).toBeVisible();
   ```

5. **Test isolation**
   - Each test should be independent
   - Use `beforeEach` for setup
   - Clean up test data if needed

## Debugging

### Run in debug mode

```bash
npx playwright test --debug
```

### Run specific test in debug mode

```bash
npx playwright test e2e/auth.spec.ts:25 --debug
```

### Generate code (record actions)

```bash
npx playwright codegen http://localhost:5173
```

### View trace

```bash
npx playwright show-trace test-results/trace.zip
```

## Common Issues

### Issue: "page.goto: net::ERR_CONNECTION_REFUSED"

**Solution:** Make sure dev server is running

```bash
pnpm --filter @horus/web dev
```

Or let Playwright start it automatically (configured in `playwright.config.ts`).

---

### Issue: "Timeout 30000ms exceeded"

**Solutions:**

1. Increase timeout in config
2. Check if element selector is correct
3. Verify backend is responding

---

### Issue: "Browser not found"

**Solution:** Install Playwright browsers

```bash
pnpm --filter @horus/web exec playwright install
```

---

### Issue: "Test failed in CI but passes locally"

**Solutions:**

1. Check for timing issues (use proper waits)
2. Verify test data exists in CI environment
3. Check for race conditions
4. Review CI logs and screenshots

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## Roadmap

Future improvements:

1. **Visual Regression Testing** - Screenshot comparison
2. **Accessibility Testing** - a11y audits with axe-core
3. **Performance Testing** - Lighthouse integration
4. **API Mocking** - Mock backend responses for faster tests
5. **Parallel Sharding** - Distribute tests across multiple machines
6. **Test Data Seeding** - Automated test data setup
