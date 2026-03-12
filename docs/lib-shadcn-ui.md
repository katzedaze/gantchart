# Shadcn UI - Library Reference

> Source: Context7 MCP (`/shadcn/ui`)

## Version

shadcn 3.5.0 (CLI) / shadcn-ui 0.9.0

## Installation (Next.js)

```bash
npx shadcn@latest init -t next
```

### Monorepo

```bash
npx shadcn@latest init -t next --monorepo
```

## Adding Components

```bash
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add toast
npx shadcn@latest add tooltip
npx shadcn@latest add sheet
npx shadcn@latest add avatar
npx shadcn@latest add calendar
npx shadcn@latest add popover
npx shadcn@latest add skeleton
```

## Usage Examples

### Button

```tsx
import { Button } from "@/components/ui/button"

export default function Home() {
  return <Button>Click me</Button>
}
```

### Form with Input, Select

```tsx
import { Button } from "@/components/ui/button"
import {
  Field, FieldDescription, FieldGroup, FieldLabel
} from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

<form className="space-y-6">
  <FieldGroup>
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input />
    </Field>
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input type="email" />
    </Field>
    <Field>
      <FieldLabel>Role</FieldLabel>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
      <FieldDescription>Select the user's role.</FieldDescription>
    </Field>
  </FieldGroup>
  <Button type="submit" className="w-full">Submit</Button>
</form>
```

## 本プロジェクトで使用するコンポーネント

| Component | Usage |
|-----------|-------|
| Button | 全般的なアクション |
| Table | 課題リスト表示 |
| Card | プロジェクトカード |
| Input | フォーム入力 |
| Select | ステータス/優先度/タイプ選択 |
| Dialog | 確認ダイアログ |
| Tabs | プロジェクト詳細のタブ |
| Badge | ステータス/優先度の色付きバッジ |
| Toast | 操作成功/失敗の通知 |
| Tooltip | ガントチャートのホバー情報 |
| Sheet | モバイルサイドバー |
| Avatar | ユーザーアバター |
| Calendar | 日付選択 |
| Popover | DatePicker用 |
| Skeleton | ローディング状態 |
