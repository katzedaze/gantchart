import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  {
    href: "/projects",
    title: "プロジェクト管理",
    description: "ガントチャートで視覚的にプロジェクトを管理",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    href: "/members",
    title: "メンバー管理",
    description: "ユーザーの登録・編集・アサイン管理",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/tools",
    title: "Developer Tools",
    description: "JSON整形、Base64、JWT、ケース変換、QRコード生成",
    icon: (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1a1.5 1.5 0 010-2.12l.71-.71a1.5 1.5 0 012.12 0l3.57 3.57 3.57-3.57a1.5 1.5 0 012.12 0l.71.71a1.5 1.5 0 010 2.12l-5.1 5.1a1.5 1.5 0 01-2.12 0z" />
      </svg>
    ),
  },
];

const tools = [
  { href: "/tools/json-formatter", title: "JSON Formatter" },
  { href: "/tools/base64", title: "Base64" },
  { href: "/tools/jwt-decoder", title: "JWT Decoder" },
  { href: "/tools/case-converter", title: "Case Converter" },
  { href: "/tools/qr-generator", title: "QR Code" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl py-12">
      <div className="mb-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <svg
            className="h-12 w-12 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          <h1 className="text-4xl font-bold">GantChart</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          プロジェクト管理 & 開発者ツール
        </p>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <div className="text-primary">{section.icon}</div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Access - Developer Tools
        </h3>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              {tool.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
