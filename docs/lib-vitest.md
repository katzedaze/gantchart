# Vitest v4 - Library Reference

> Source: Context7 MCP (`/vitest-dev/vitest/v4.0.7`)

## Version

v4.0.7

## Installation

```bash
bun add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test file patterns
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Environment
    environment: 'jsdom', // React Testing Library用
    globals: true,

    // Execution
    pool: 'forks',
    fileParallelism: true,
    testTimeout: 5000,

    // Coverage
    coverage: {
      provider: 'v8',
      enabled: false,
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Setup files
    setupFiles: ['./test/setup.ts'],

    // Mocking behavior
    clearMocks: true,
    restoreMocks: true,
  },
})
```

## Per-file Environment Override

```ts
/**
 * @vitest-environment jsdom
 */
import { test, expect } from 'vitest'

test('DOM environment is available', () => {
  const element = document.createElement('div')
  element.textContent = 'Hello World'
  expect(element.tagName).toBe('DIV')
  expect(element.textContent).toBe('Hello World')
})
```

## Coverage Script

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage"
  }
}
```

## Setup File Example

```ts
// test/setup.ts
import '@testing-library/jest-dom'
```

## Test Examples

### Component Test

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Hook Test

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### Utility Test

```ts
import { describe, it, expect } from 'vitest'
import { dateToPixel, pixelToDate } from '@/lib/gantt-utils'

describe('gantt-utils', () => {
  it('converts date to pixel position', () => {
    const result = dateToPixel(new Date('2024-01-15'), {
      startDate: new Date('2024-01-01'),
      pixelsPerDay: 30,
    })
    expect(result).toBe(420) // 14 days * 30px
  })
})
```
