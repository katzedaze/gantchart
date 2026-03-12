import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-20">
      <div className="flex items-center gap-3">
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
      <p className="text-center text-lg text-muted-foreground">
        ガントチャートで視覚的にプロジェクトを管理
      </p>
      <div className="flex gap-3">
        <Link href="/projects">
          <Button size="lg">プロジェクト一覧</Button>
        </Link>
        <Link href="/members">
          <Button size="lg" variant="outline">
            メンバー管理
          </Button>
        </Link>
      </div>
    </div>
  );
}
