# Next.js v16 - Library Reference

> Source: Context7 MCP (`/vercel/next.js/v16.1.6`)

## Version

v16.1.6 (Latest stable)

## Key Changes in v16

### Environment Variables

- `NEXT_PUBLIC_` prefixed変数はクライアントコンポーネントで利用可能（`publicRuntimeConfig`の代替）
- サーバーコンポーネントではサーバー専用の環境変数に直接アクセス可能

```tsx
// Client Component
'use client'
export default function ClientComponent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  return <p>API URL: {apiUrl}</p>
}
```

```tsx
// Server Component
async function fetchData() {
  const dbUrl = process.env.DATABASE_URL
  return await db.query(dbUrl, 'SELECT * FROM users')
}
```

## App Router

### Server Components (Default)

ページファイルはデフォルトでServer Component。`async`関数として定義し、直接データフェッチ可能。

```tsx
import HomePage from './home-page'

async function getPosts() {
  const res = await fetch('https://...')
  const posts = await res.json()
  return posts
}

export default async function Page() {
  const recentPosts = await getPosts()
  return <HomePage recentPosts={recentPosts} />
}
```

### Client Components

`'use client'`ディレクティブで明示。インタラクティブな機能（useState, useEffect等）が必要な場合に使用。

### Data Fetching

```tsx
export default async function Page() {
  // Static data (cached)
  const staticData = await fetch(`https://...`, { cache: 'force-cache' })

  // Dynamic data (no cache)
  const dynamicData = await fetch(`https://...`, { cache: 'no-store' })

  // Revalidated data (ISR)
  const revalidatedData = await fetch(`https://...`, {
    next: { revalidate: 10 },
  })

  return <div>...</div>
}
```

### Nested Layouts

```tsx
// app/dashboard/layout.tsx
import DashboardLayout from './DashboardLayout'

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
```

```tsx
// app/dashboard/DashboardLayout.tsx
'use client'
export default function DashboardLayout({ children }) {
  return (
    <div>
      <h2>My Dashboard</h2>
      {children}
    </div>
  )
}
```

## Project Setup (with Bun)

```bash
bun create next-app@latest frontend --typescript --app --tailwind --src-dir
```

## Configuration

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // config options
}

export default nextConfig
```

## Environment Files

- `.env.local` - ローカル開発用（git管理外）
- `.env.production` - 本番環境用
- `.env.development` - 開発環境用
