export type SkillLevel = "none" | "learning" | "done";

export interface Skill {
  id: string;
  name: string;
}

export interface SkillCategory {
  category: string;
  skills: Skill[];
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  icon: string;
  categories: SkillCategory[];
}

export const roadmaps: Roadmap[] = [
  {
    id: "frontend",
    title: "フロントエンド",
    description: "フロントエンド開発者ロードマップ",
    icon: "🌐",
    categories: [
      {
        category: "インターネット基礎",
        skills: [
          { id: "fe-internet", name: "インターネットの仕組み" },
          { id: "fe-http", name: "HTTP / HTTPS" },
          { id: "fe-dns", name: "DNS の仕組み" },
          { id: "fe-domain", name: "ドメイン名" },
          { id: "fe-hosting", name: "Web ホスティング" },
          { id: "fe-browser", name: "ブラウザの動作原理" },
        ],
      },
      {
        category: "HTML",
        skills: [
          { id: "fe-html-basics", name: "HTML 基本構文" },
          { id: "fe-html-semantic", name: "セマンティック HTML" },
          { id: "fe-html-forms", name: "フォーム・バリデーション" },
          { id: "fe-html-accessibility", name: "アクセシビリティ (a11y)" },
          { id: "fe-html-seo", name: "SEO 基礎" },
        ],
      },
      {
        category: "CSS",
        skills: [
          { id: "fe-css-basics", name: "CSS 基本構文" },
          { id: "fe-css-layout", name: "Flexbox / Grid レイアウト" },
          { id: "fe-css-responsive", name: "レスポンシブデザイン" },
          { id: "fe-css-animation", name: "CSS アニメーション" },
          { id: "fe-css-tailwind", name: "Tailwind CSS" },
          { id: "fe-css-sass", name: "Sass / PostCSS" },
        ],
      },
      {
        category: "JavaScript",
        skills: [
          { id: "fe-js-basics", name: "JS 基本構文・データ型" },
          { id: "fe-js-dom", name: "DOM 操作" },
          { id: "fe-js-async", name: "非同期処理 (Promise / async-await)" },
          { id: "fe-js-fetch", name: "Fetch API / Ajax" },
          { id: "fe-js-es6", name: "ES6+ 機能" },
          { id: "fe-js-modules", name: "モジュールシステム" },
        ],
      },
      {
        category: "TypeScript",
        skills: [
          { id: "fe-ts-basics", name: "TypeScript 基本" },
          { id: "fe-ts-types", name: "型定義・ジェネリクス" },
          { id: "fe-ts-advanced", name: "高度な型 (Utility Types)" },
        ],
      },
      {
        category: "フレームワーク",
        skills: [
          { id: "fe-react", name: "React" },
          { id: "fe-vue", name: "Vue.js" },
          { id: "fe-angular", name: "Angular" },
          { id: "fe-svelte", name: "Svelte" },
          { id: "fe-nextjs", name: "Next.js" },
          { id: "fe-nuxt", name: "Nuxt.js" },
        ],
      },
      {
        category: "ビルドツール",
        skills: [
          { id: "fe-npm", name: "npm / yarn / pnpm" },
          { id: "fe-vite", name: "Vite" },
          { id: "fe-webpack", name: "Webpack" },
          { id: "fe-eslint", name: "ESLint / Prettier" },
        ],
      },
      {
        category: "テスト",
        skills: [
          { id: "fe-test-unit", name: "ユニットテスト (Vitest / Jest)" },
          { id: "fe-test-e2e", name: "E2E テスト (Playwright / Cypress)" },
          { id: "fe-test-component", name: "コンポーネントテスト" },
        ],
      },
      {
        category: "パフォーマンス・セキュリティ",
        skills: [
          { id: "fe-perf-lighthouse", name: "Lighthouse / Core Web Vitals" },
          { id: "fe-perf-optimize", name: "パフォーマンス最適化" },
          { id: "fe-security-cors", name: "CORS" },
          { id: "fe-security-csp", name: "CSP / XSS 対策" },
          { id: "fe-pwa", name: "PWA (Progressive Web Apps)" },
        ],
      },
    ],
  },
  {
    id: "backend",
    title: "バックエンド",
    description: "バックエンド開発者ロードマップ",
    icon: "⚙️",
    categories: [
      {
        category: "インターネット・OS 基礎",
        skills: [
          { id: "be-internet", name: "インターネットの仕組み" },
          { id: "be-http", name: "HTTP / HTTPS" },
          { id: "be-os-basics", name: "OS の基本 (プロセス・スレッド)" },
          { id: "be-terminal", name: "ターミナル操作" },
          { id: "be-networking", name: "ネットワーク基礎" },
        ],
      },
      {
        category: "プログラミング言語",
        skills: [
          { id: "be-python", name: "Python" },
          { id: "be-javascript", name: "JavaScript / Node.js" },
          { id: "be-go", name: "Go" },
          { id: "be-java", name: "Java" },
          { id: "be-rust", name: "Rust" },
          { id: "be-csharp", name: "C#" },
        ],
      },
      {
        category: "データベース",
        skills: [
          { id: "be-rdb", name: "リレーショナル DB (PostgreSQL / MySQL)" },
          { id: "be-nosql", name: "NoSQL (MongoDB / Redis)" },
          { id: "be-orm", name: "ORM (Prisma / SQLAlchemy)" },
          { id: "be-sql", name: "SQL クエリ最適化" },
          { id: "be-migration", name: "マイグレーション管理" },
        ],
      },
      {
        category: "API 設計",
        skills: [
          { id: "be-rest", name: "REST API 設計" },
          { id: "be-graphql", name: "GraphQL" },
          { id: "be-grpc", name: "gRPC" },
          { id: "be-websocket", name: "WebSocket" },
          { id: "be-auth", name: "認証・認可 (JWT / OAuth)" },
        ],
      },
      {
        category: "Web フレームワーク",
        skills: [
          { id: "be-express", name: "Express / Fastify" },
          { id: "be-django", name: "Django / FastAPI" },
          { id: "be-spring", name: "Spring Boot" },
          { id: "be-gin", name: "Gin / Echo (Go)" },
          { id: "be-rails", name: "Ruby on Rails" },
        ],
      },
      {
        category: "キャッシュ・メッセージング",
        skills: [
          { id: "be-cache", name: "キャッシュ戦略 (Redis / Memcached)" },
          { id: "be-mq", name: "メッセージキュー (RabbitMQ / Kafka)" },
          { id: "be-search", name: "検索エンジン (Elasticsearch)" },
        ],
      },
      {
        category: "テスト・セキュリティ",
        skills: [
          { id: "be-test-unit", name: "ユニットテスト" },
          { id: "be-test-integration", name: "インテグレーションテスト" },
          { id: "be-security-owasp", name: "OWASP Top 10" },
          { id: "be-security-hash", name: "パスワードハッシュ化" },
          { id: "be-rate-limit", name: "レートリミット" },
        ],
      },
      {
        category: "スケーラビリティ",
        skills: [
          { id: "be-scale-horizontal", name: "水平スケーリング" },
          { id: "be-scale-lb", name: "ロードバランサー" },
          { id: "be-microservices", name: "マイクロサービス" },
          { id: "be-serverless", name: "サーバーレス" },
        ],
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps",
    description: "DevOps エンジニアロードマップ",
    icon: "🔄",
    categories: [
      {
        category: "OS・Linux",
        skills: [
          { id: "do-linux-basics", name: "Linux 基礎コマンド" },
          { id: "do-shell", name: "シェルスクリプト (Bash)" },
          { id: "do-filesystem", name: "ファイルシステム管理" },
          { id: "do-process", name: "プロセス管理" },
          { id: "do-networking", name: "ネットワーク設定" },
        ],
      },
      {
        category: "バージョン管理",
        skills: [
          { id: "do-git", name: "Git" },
          { id: "do-github", name: "GitHub / GitLab" },
          { id: "do-branching", name: "ブランチ戦略" },
        ],
      },
      {
        category: "コンテナ・オーケストレーション",
        skills: [
          { id: "do-docker", name: "Docker" },
          { id: "do-compose", name: "Docker Compose" },
          { id: "do-k8s", name: "Kubernetes" },
          { id: "do-helm", name: "Helm" },
        ],
      },
      {
        category: "CI/CD",
        skills: [
          { id: "do-gha", name: "GitHub Actions" },
          { id: "do-jenkins", name: "Jenkins" },
          { id: "do-gitlab-ci", name: "GitLab CI" },
          { id: "do-argocd", name: "ArgoCD" },
        ],
      },
      {
        category: "クラウド",
        skills: [
          { id: "do-aws", name: "AWS" },
          { id: "do-gcp", name: "GCP" },
          { id: "do-azure", name: "Azure" },
        ],
      },
      {
        category: "IaC (Infrastructure as Code)",
        skills: [
          { id: "do-terraform", name: "Terraform" },
          { id: "do-ansible", name: "Ansible" },
          { id: "do-pulumi", name: "Pulumi" },
          { id: "do-cloudformation", name: "CloudFormation" },
        ],
      },
      {
        category: "モニタリング・ログ",
        skills: [
          { id: "do-prometheus", name: "Prometheus / Grafana" },
          { id: "do-elk", name: "ELK Stack" },
          { id: "do-datadog", name: "Datadog" },
          { id: "do-alerting", name: "アラート設計" },
        ],
      },
      {
        category: "セキュリティ",
        skills: [
          { id: "do-devsecops", name: "DevSecOps" },
          { id: "do-secret", name: "シークレット管理 (Vault)" },
          { id: "do-scan", name: "脆弱性スキャン" },
        ],
      },
    ],
  },
  {
    id: "react",
    title: "React",
    description: "React 開発者ロードマップ",
    icon: "⚛️",
    categories: [
      {
        category: "基礎",
        skills: [
          { id: "rc-jsx", name: "JSX" },
          { id: "rc-components", name: "コンポーネント (関数コンポーネント)" },
          { id: "rc-props", name: "Props" },
          { id: "rc-state", name: "State 管理" },
          { id: "rc-events", name: "イベントハンドリング" },
          { id: "rc-conditional", name: "条件付きレンダリング" },
          { id: "rc-lists", name: "リストとキー" },
        ],
      },
      {
        category: "Hooks",
        skills: [
          { id: "rc-usestate", name: "useState" },
          { id: "rc-useeffect", name: "useEffect" },
          { id: "rc-useref", name: "useRef" },
          { id: "rc-usememo", name: "useMemo / useCallback" },
          { id: "rc-usecontext", name: "useContext" },
          { id: "rc-usereducer", name: "useReducer" },
          { id: "rc-custom-hooks", name: "カスタムフック" },
        ],
      },
      {
        category: "状態管理",
        skills: [
          { id: "rc-context", name: "Context API" },
          { id: "rc-zustand", name: "Zustand" },
          { id: "rc-redux", name: "Redux Toolkit" },
          { id: "rc-jotai", name: "Jotai / Recoil" },
        ],
      },
      {
        category: "ルーティング・データ取得",
        skills: [
          { id: "rc-router", name: "React Router" },
          { id: "rc-tanstack-query", name: "TanStack Query (React Query)" },
          { id: "rc-swr", name: "SWR" },
          { id: "rc-fetch", name: "データフェッチパターン" },
        ],
      },
      {
        category: "スタイリング",
        skills: [
          { id: "rc-css-modules", name: "CSS Modules" },
          { id: "rc-tailwind", name: "Tailwind CSS" },
          { id: "rc-styled", name: "Styled Components / Emotion" },
          { id: "rc-ui-lib", name: "UI ライブラリ (shadcn/ui, MUI)" },
        ],
      },
      {
        category: "フォーム・バリデーション",
        skills: [
          { id: "rc-forms", name: "React Hook Form" },
          { id: "rc-zod", name: "Zod / Yup バリデーション" },
        ],
      },
      {
        category: "テスト",
        skills: [
          { id: "rc-testing-lib", name: "React Testing Library" },
          { id: "rc-vitest", name: "Vitest / Jest" },
          { id: "rc-e2e", name: "E2E テスト (Playwright)" },
          { id: "rc-storybook", name: "Storybook" },
        ],
      },
      {
        category: "フレームワーク",
        skills: [
          { id: "rc-nextjs", name: "Next.js (App Router / RSC)" },
          { id: "rc-remix", name: "Remix" },
          { id: "rc-rsc", name: "React Server Components" },
          { id: "rc-suspense", name: "Suspense / Streaming" },
        ],
      },
      {
        category: "パフォーマンス",
        skills: [
          { id: "rc-memo", name: "React.memo / メモ化" },
          { id: "rc-lazy", name: "React.lazy / コード分割" },
          { id: "rc-profiler", name: "React DevTools Profiler" },
          { id: "rc-virtualization", name: "仮想化 (TanStack Virtual)" },
        ],
      },
    ],
  },
  {
    id: "typescript",
    title: "TypeScript",
    description: "TypeScript ロードマップ",
    icon: "📘",
    categories: [
      {
        category: "基本型",
        skills: [
          { id: "ts-primitives", name: "プリミティブ型 (string, number, boolean)" },
          { id: "ts-arrays", name: "配列・タプル" },
          { id: "ts-enum", name: "Enum" },
          { id: "ts-any-unknown", name: "any / unknown / never" },
          { id: "ts-type-assertion", name: "型アサーション" },
        ],
      },
      {
        category: "型定義",
        skills: [
          { id: "ts-interface", name: "Interface" },
          { id: "ts-type-alias", name: "Type Alias" },
          { id: "ts-union", name: "Union / Intersection 型" },
          { id: "ts-literal", name: "リテラル型" },
          { id: "ts-optional", name: "オプショナル・Readonly" },
        ],
      },
      {
        category: "ジェネリクス",
        skills: [
          { id: "ts-generics-basics", name: "ジェネリクス基礎" },
          { id: "ts-constraints", name: "制約 (extends)" },
          { id: "ts-generic-inference", name: "型推論" },
        ],
      },
      {
        category: "高度な型",
        skills: [
          { id: "ts-utility", name: "Utility Types (Partial, Pick, Omit)" },
          { id: "ts-mapped", name: "Mapped Types" },
          { id: "ts-conditional", name: "Conditional Types" },
          { id: "ts-template-literal", name: "Template Literal Types" },
          { id: "ts-infer", name: "infer キーワード" },
          { id: "ts-satisfies", name: "satisfies 演算子" },
        ],
      },
      {
        category: "型ガード・ナローイング",
        skills: [
          { id: "ts-narrowing", name: "型ナローイング" },
          { id: "ts-type-guard", name: "カスタム型ガード (is)" },
          { id: "ts-discriminated", name: "判別可能なユニオン" },
        ],
      },
      {
        category: "モジュール・設定",
        skills: [
          { id: "ts-modules", name: "モジュールシステム" },
          { id: "ts-tsconfig", name: "tsconfig.json 設定" },
          { id: "ts-strict", name: "strict モード" },
          { id: "ts-declaration", name: "型宣言ファイル (.d.ts)" },
        ],
      },
    ],
  },
  {
    id: "python",
    title: "Python",
    description: "Python 開発者ロードマップ",
    icon: "🐍",
    categories: [
      {
        category: "基礎",
        skills: [
          { id: "py-syntax", name: "基本構文・変数・データ型" },
          { id: "py-control", name: "制御構文 (if / for / while)" },
          { id: "py-functions", name: "関数・ラムダ" },
          { id: "py-data-structures", name: "データ構造 (list / dict / set / tuple)" },
          { id: "py-oop", name: "オブジェクト指向プログラミング" },
          { id: "py-exceptions", name: "例外処理" },
          { id: "py-modules", name: "モジュール・パッケージ" },
        ],
      },
      {
        category: "中級",
        skills: [
          { id: "py-decorators", name: "デコレータ" },
          { id: "py-generators", name: "ジェネレータ・イテレータ" },
          { id: "py-context-manager", name: "コンテキストマネージャ (with)" },
          { id: "py-comprehension", name: "内包表記" },
          { id: "py-type-hints", name: "型ヒント (typing)" },
          { id: "py-async", name: "非同期処理 (asyncio)" },
        ],
      },
      {
        category: "Web フレームワーク",
        skills: [
          { id: "py-django", name: "Django" },
          { id: "py-fastapi", name: "FastAPI" },
          { id: "py-flask", name: "Flask" },
        ],
      },
      {
        category: "データサイエンス・AI",
        skills: [
          { id: "py-numpy", name: "NumPy" },
          { id: "py-pandas", name: "Pandas" },
          { id: "py-matplotlib", name: "Matplotlib / Seaborn" },
          { id: "py-sklearn", name: "scikit-learn" },
          { id: "py-pytorch", name: "PyTorch / TensorFlow" },
        ],
      },
      {
        category: "ツール・テスト",
        skills: [
          { id: "py-pip", name: "pip / Poetry / uv" },
          { id: "py-venv", name: "仮想環境 (venv)" },
          { id: "py-pytest", name: "pytest" },
          { id: "py-ruff", name: "Ruff / Black / isort" },
          { id: "py-mypy", name: "mypy (静的型チェック)" },
        ],
      },
    ],
  },
  {
    id: "golang",
    title: "Go",
    description: "Go 言語ロードマップ",
    icon: "🔷",
    categories: [
      {
        category: "基礎",
        skills: [
          { id: "go-syntax", name: "基本構文・変数・型" },
          { id: "go-control", name: "制御構文・ループ" },
          { id: "go-functions", name: "関数・多値返却" },
          { id: "go-structs", name: "構造体・メソッド" },
          { id: "go-interfaces", name: "インターフェース" },
          { id: "go-errors", name: "エラーハンドリング" },
          { id: "go-packages", name: "パッケージ・モジュール" },
        ],
      },
      {
        category: "並行処理",
        skills: [
          { id: "go-goroutines", name: "Goroutine" },
          { id: "go-channels", name: "Channel" },
          { id: "go-select", name: "Select" },
          { id: "go-sync", name: "sync パッケージ (Mutex / WaitGroup)" },
          { id: "go-context", name: "Context" },
        ],
      },
      {
        category: "Web 開発",
        skills: [
          { id: "go-net-http", name: "net/http 標準ライブラリ" },
          { id: "go-gin", name: "Gin / Echo / Chi" },
          { id: "go-middleware", name: "ミドルウェア" },
          { id: "go-db", name: "データベース (GORM / sqlx)" },
        ],
      },
      {
        category: "ツール・テスト",
        skills: [
          { id: "go-testing", name: "テスト (testing パッケージ)" },
          { id: "go-bench", name: "ベンチマーク" },
          { id: "go-lint", name: "golangci-lint" },
          { id: "go-mod", name: "Go Modules" },
        ],
      },
    ],
  },
  {
    id: "docker",
    title: "Docker",
    description: "Docker ロードマップ",
    icon: "🐳",
    categories: [
      {
        category: "基礎",
        skills: [
          { id: "dk-concepts", name: "コンテナの概念" },
          { id: "dk-install", name: "Docker インストール・設定" },
          { id: "dk-images", name: "イメージの仕組み" },
          { id: "dk-containers", name: "コンテナの操作" },
          { id: "dk-registry", name: "Docker Hub / レジストリ" },
        ],
      },
      {
        category: "Dockerfile",
        skills: [
          { id: "dk-dockerfile", name: "Dockerfile の書き方" },
          { id: "dk-multistage", name: "マルチステージビルド" },
          { id: "dk-cache", name: "ビルドキャッシュ最適化" },
          { id: "dk-distroless", name: "軽量イメージ (Alpine / Distroless)" },
        ],
      },
      {
        category: "Docker Compose",
        skills: [
          { id: "dk-compose", name: "Compose ファイル構成" },
          { id: "dk-services", name: "複数サービス管理" },
          { id: "dk-volumes", name: "ボリューム・永続化" },
          { id: "dk-networks", name: "ネットワーク設定" },
          { id: "dk-env", name: "環境変数管理" },
        ],
      },
      {
        category: "運用",
        skills: [
          { id: "dk-security", name: "コンテナセキュリティ" },
          { id: "dk-logging", name: "ログ管理" },
          { id: "dk-monitoring", name: "モニタリング" },
          { id: "dk-ci", name: "CI/CD でのDocker 活用" },
        ],
      },
    ],
  },
  {
    id: "aws",
    title: "AWS",
    description: "AWS クラウドロードマップ",
    icon: "☁️",
    categories: [
      {
        category: "コンピューティング",
        skills: [
          { id: "aws-ec2", name: "EC2" },
          { id: "aws-lambda", name: "Lambda" },
          { id: "aws-ecs", name: "ECS / Fargate" },
          { id: "aws-eks", name: "EKS (Kubernetes)" },
          { id: "aws-eb", name: "Elastic Beanstalk" },
        ],
      },
      {
        category: "ストレージ・DB",
        skills: [
          { id: "aws-s3", name: "S3" },
          { id: "aws-rds", name: "RDS (PostgreSQL / MySQL)" },
          { id: "aws-dynamodb", name: "DynamoDB" },
          { id: "aws-elasticache", name: "ElastiCache (Redis)" },
          { id: "aws-aurora", name: "Aurora" },
        ],
      },
      {
        category: "ネットワーク",
        skills: [
          { id: "aws-vpc", name: "VPC" },
          { id: "aws-route53", name: "Route 53" },
          { id: "aws-cloudfront", name: "CloudFront" },
          { id: "aws-elb", name: "ELB (ロードバランサー)" },
          { id: "aws-api-gw", name: "API Gateway" },
        ],
      },
      {
        category: "セキュリティ・IAM",
        skills: [
          { id: "aws-iam", name: "IAM" },
          { id: "aws-cognito", name: "Cognito" },
          { id: "aws-kms", name: "KMS / Secrets Manager" },
          { id: "aws-waf", name: "WAF / Shield" },
        ],
      },
      {
        category: "モニタリング・DevOps",
        skills: [
          { id: "aws-cloudwatch", name: "CloudWatch" },
          { id: "aws-cloudformation", name: "CloudFormation" },
          { id: "aws-codepipeline", name: "CodePipeline / CodeBuild" },
          { id: "aws-sns-sqs", name: "SNS / SQS" },
          { id: "aws-eventbridge", name: "EventBridge" },
        ],
      },
    ],
  },
  {
    id: "system-design",
    title: "システム設計",
    description: "システム設計ロードマップ",
    icon: "🏗️",
    categories: [
      {
        category: "基礎概念",
        skills: [
          { id: "sd-cap", name: "CAP 定理" },
          { id: "sd-consistency", name: "一貫性パターン" },
          { id: "sd-availability", name: "可用性パターン" },
          { id: "sd-latency", name: "レイテンシ・スループット" },
        ],
      },
      {
        category: "スケーリング",
        skills: [
          { id: "sd-horizontal", name: "水平・垂直スケーリング" },
          { id: "sd-lb", name: "ロードバランサー" },
          { id: "sd-cdn", name: "CDN" },
          { id: "sd-sharding", name: "データベースシャーディング" },
          { id: "sd-replication", name: "レプリケーション" },
        ],
      },
      {
        category: "キャッシュ・DB",
        skills: [
          { id: "sd-cache-strategy", name: "キャッシュ戦略" },
          { id: "sd-sql-nosql", name: "SQL vs NoSQL 選定" },
          { id: "sd-indexing", name: "インデックス設計" },
          { id: "sd-normalization", name: "正規化・非正規化" },
        ],
      },
      {
        category: "アーキテクチャパターン",
        skills: [
          { id: "sd-microservices", name: "マイクロサービス" },
          { id: "sd-event-driven", name: "イベント駆動アーキテクチャ" },
          { id: "sd-cqrs", name: "CQRS / Event Sourcing" },
          { id: "sd-saga", name: "Saga パターン" },
          { id: "sd-api-gateway", name: "API Gateway パターン" },
        ],
      },
      {
        category: "メッセージング・通信",
        skills: [
          { id: "sd-mq", name: "メッセージキュー" },
          { id: "sd-pubsub", name: "Pub/Sub" },
          { id: "sd-rest-grpc", name: "REST vs gRPC vs GraphQL" },
          { id: "sd-rate-limiting", name: "レートリミッター設計" },
        ],
      },
      {
        category: "実践ケーススタディ",
        skills: [
          { id: "sd-url-shortener", name: "URL 短縮サービス設計" },
          { id: "sd-chat", name: "チャットシステム設計" },
          { id: "sd-twitter", name: "SNS タイムライン設計" },
          { id: "sd-notification", name: "通知システム設計" },
        ],
      },
    ],
  },
];
