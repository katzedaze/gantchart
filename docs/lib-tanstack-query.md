# TanStack Query v5 (React Query) - Library Reference

> Source: Context7 MCP (`/tanstack/query/v5_84_1`)

## Version

v5.84.1

## Setup

```tsx
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

## useQuery - データ取得

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const query = useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
  })

  return (
    <ul>
      {query.data?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

## useMutation - データ変更

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

function AddTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      // キャッシュ無効化 → 再フェッチ
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate({ title: 'New Todo' })}>
      Add Todo
    </button>
  )
}
```

## Optimistic Updates

### 方法1: キャッシュ直接操作

```tsx
const mutation = useMutation({
  mutationFn: async (newTodo) => {
    return await api.post('/todos', newTodo)
  },
  onMutate: async (newTodo) => {
    // 進行中のリフェッチをキャンセル
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // 以前の値のスナップショット
    const previousTodos = queryClient.getQueryData(['todos'])

    // 楽観的にキャッシュを更新
    queryClient.setQueryData(['todos'], (old) => [
      ...old,
      { id: Date.now(), ...newTodo },
    ])

    // ロールバック用にコンテキストを返す
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // エラー時にロールバック
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    // 成功/失敗に関わらずリフェッチ
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### 方法2: v5 Simplified (variables使用)

```tsx
const queryInfo = useTodos()
const addTodoMutation = useMutation({
  mutationFn: (newTodo: string) => axios.post('/api/data', { text: newTodo }),
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

if (queryInfo.data) {
  return (
    <ul>
      {queryInfo.data.items.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
      {addTodoMutation.isPending && (
        <li key={String(addTodoMutation.submittedAt)} style={{ opacity: 0.5 }}>
          {addTodoMutation.variables}
        </li>
      )}
    </ul>
  )
}
```

## useQueryClient - キャッシュ操作

```tsx
import { useQueryClient } from '@tanstack/react-query'

function MyComponent() {
  const queryClient = useQueryClient()

  const handleClick = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  }

  return <button onClick={handleClick}>Invalidate Todos</button>
}
```

## Query Key規約 (本プロジェクト)

```ts
// プロジェクト
['projects']
['projects', projectId]

// 課題
['projects', projectId, 'issues']
['issues', issueId]

// ガントデータ
['projects', projectId, 'gantt']

// マイルストーン
['projects', projectId, 'milestones']

// 依存関係
['issues', issueId, 'dependencies']
```

## Installation

```bash
bun add @tanstack/react-query
bun add -D @tanstack/react-query-devtools
```
