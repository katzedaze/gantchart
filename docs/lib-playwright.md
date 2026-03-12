# Playwright - Library Reference

> Source: Context7 MCP (`/microsoft/playwright/v1.58.2`)

## Version

v1.58.2

## Installation

```bash
bun add -D @playwright/test
npx playwright install
```

## Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Test Examples

### Basic Navigation and Assertions

```typescript
import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('https://example.com/')
  await page.getByRole('link', { name: 'Get started' }).click()
  await expect(page.getByLabel('Breadcrumbs').getByRole('list'))
    .toContainText('Installation')
  await expect(page.getByLabel('Search')).toBeVisible()
})
```

### Form Interactions

```typescript
test('create project', async ({ page }) => {
  await page.goto('/projects/new')

  // Fill form
  await page.getByLabel('Project Name').fill('My Project')
  await page.getByLabel('Key').fill('MYPROJ')
  await page.getByLabel('Description').fill('A test project')

  // Submit
  await page.getByRole('button', { name: 'Create' }).click()

  // Verify redirect and content
  await expect(page).toHaveURL(/\/projects\//)
  await expect(page.getByText('My Project')).toBeVisible()
})
```

### Search and Filter

```typescript
test('search input', async ({ page }) => {
  await page.goto('/projects/123/issues')

  await page.getByPlaceholder('Search issues').click()
  await page.getByPlaceholder('Search issues').fill('bug fix')
  await page.getByPlaceholder('Search issues').press('Enter')

  await expect(page.getByPlaceholder('Search issues')).toHaveValue('bug fix')
})
```

## Locator Strategy

```typescript
// Role-based (推奨)
page.getByRole('button', { name: 'Submit' })
page.getByRole('link', { name: 'Home' })
page.getByRole('heading', { name: 'Title' })

// Label-based
page.getByLabel('Email')

// Placeholder-based
page.getByPlaceholder('Search...')

// Text-based
page.getByText('Welcome')

// Test ID-based
page.getByTestId('gantt-bar')

// CSS selector (最後の手段)
page.locator('.gantt-bar')
```

## Assertions

```typescript
await expect(page).toHaveURL('/projects')
await expect(page).toHaveTitle('Projects')
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toContainText('text')
await expect(locator).toHaveValue('value')
await expect(locator).toHaveAttribute('href', '/path')
await expect(locator).toBeChecked()
await expect(locator).toBeDisabled()
```

## Drag and Drop (Gantt Chart用)

```typescript
test('drag gantt bar to change dates', async ({ page }) => {
  await page.goto('/projects/123/gantt')

  const bar = page.getByTestId('gantt-bar-PROJ-1')
  const target = page.getByTestId('gantt-cell-2024-01-20')

  // Drag and drop
  await bar.dragTo(target)

  // Or manual drag
  await bar.hover()
  await page.mouse.down()
  await page.mouse.move(300, 0)
  await page.mouse.up()
})
```

## Scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```
