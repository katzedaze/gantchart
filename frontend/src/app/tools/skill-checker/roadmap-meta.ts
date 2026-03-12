/** Metadata for popular roadmaps displayed on the skill checker index page */
export interface RoadmapMeta {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export const popularRoadmaps: RoadmapMeta[] = [
  { slug: "frontend", title: "フロントエンド", description: "フロントエンド開発者ロードマップ", icon: "🌐" },
  { slug: "backend", title: "バックエンド", description: "バックエンド開発者ロードマップ", icon: "⚙️" },
  { slug: "devops", title: "DevOps", description: "DevOps エンジニアロードマップ", icon: "🔄" },
  { slug: "full-stack", title: "フルスタック", description: "フルスタック開発者ロードマップ", icon: "🔗" },
  { slug: "ai-engineer", title: "AI エンジニア", description: "AI エンジニアロードマップ", icon: "🤖" },
  { slug: "data-engineer", title: "データエンジニア", description: "データエンジニアロードマップ", icon: "📊" },
  { slug: "android", title: "Android", description: "Android 開発者ロードマップ", icon: "📱" },
  { slug: "ios", title: "iOS", description: "iOS 開発者ロードマップ", icon: "🍎" },
  { slug: "react", title: "React", description: "React 開発者ロードマップ", icon: "⚛️" },
  { slug: "vue", title: "Vue.js", description: "Vue.js 開発者ロードマップ", icon: "💚" },
  { slug: "angular", title: "Angular", description: "Angular 開発者ロードマップ", icon: "🅰️" },
  { slug: "typescript", title: "TypeScript", description: "TypeScript ロードマップ", icon: "📘" },
  { slug: "javascript", title: "JavaScript", description: "JavaScript ロードマップ", icon: "📒" },
  { slug: "nodejs", title: "Node.js", description: "Node.js 開発者ロードマップ", icon: "💻" },
  { slug: "python", title: "Python", description: "Python 開発者ロードマップ", icon: "🐍" },
  { slug: "golang", title: "Go", description: "Go 言語ロードマップ", icon: "🔷" },
  { slug: "rust", title: "Rust", description: "Rust ロードマップ", icon: "🦀" },
  { slug: "java", title: "Java", description: "Java 開発者ロードマップ", icon: "☕" },
  { slug: "cpp", title: "C++", description: "C++ 開発者ロードマップ", icon: "🔧" },
  { slug: "docker", title: "Docker", description: "Docker ロードマップ", icon: "🐳" },
  { slug: "kubernetes", title: "Kubernetes", description: "Kubernetes ロードマップ", icon: "☸️" },
  { slug: "aws", title: "AWS", description: "AWS クラウドロードマップ", icon: "☁️" },
  { slug: "cyber-security", title: "サイバーセキュリティ", description: "サイバーセキュリティロードマップ", icon: "🔒" },
  { slug: "mlops", title: "MLOps", description: "MLOps ロードマップ", icon: "🧪" },
  { slug: "postgresql-dba", title: "PostgreSQL DBA", description: "PostgreSQL DBA ロードマップ", icon: "🐘" },
  { slug: "system-design", title: "システム設計", description: "システム設計ロードマップ", icon: "🏗️" },
  { slug: "software-architect", title: "ソフトウェアアーキテクト", description: "ソフトウェアアーキテクトロードマップ", icon: "🏛️" },
  { slug: "graphql", title: "GraphQL", description: "GraphQL ロードマップ", icon: "◼️" },
  { slug: "sql", title: "SQL", description: "SQL ロードマップ", icon: "🗃️" },
  { slug: "git-github", title: "Git & GitHub", description: "Git & GitHub ロードマップ", icon: "🐙" },
  { slug: "linux", title: "Linux", description: "Linux ロードマップ", icon: "🐧" },
];

/** Map for looking up metadata by slug */
export const roadmapMetaMap = new Map(
  popularRoadmaps.map((r) => [r.slug, r])
);
