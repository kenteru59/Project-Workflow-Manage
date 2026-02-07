# ワークフロー管理Webアプリケーション

業務のワークフロー（承認フロー、タスク管理）を一元管理するWebアプリケーションです。ワークフローテンプレートを事前登録し、テンプレートからインスタンスを生成してタスクを自動作成、カンバンボードで進捗管理、承認フローで段階的に処理を進めます。

## 技術スタック

| レイヤー | 技術 | 理由 |
|---------|------|------|
| パッケージ管理 | pnpm + Turborepo | 効率的なmonorepo管理 |
| フロントエンド | React 19 + TypeScript + Vite | モダンなSPA開発 |
| UIライブラリ | shadcn/ui + Tailwind CSS | 軽量、カスタマイズ自由 |
| 状態管理 | Zustand (UI) + TanStack Query (サーバー) | 軽量で実用的 |
| ルーティング | React Router v7 | 業界標準 |
| ドラッグ&ドロップ | @dnd-kit | カンバンボード用 |
| バックエンド | Hono (TypeScript) | 超軽量、Lambda対応、型安全 |
| バリデーション | Zod | フロント/バック共有 |
| データベース | DynamoDB (on-demand) | コスト最小（無料枠活用） |
| ローカルDB | DynamoDB Local (Docker) | 本番と同一API |
| IaC | Terraform | インフラのコード化 |
| 認証 | AWS Cognito | セキュアな認証管理 |
| UI言語 | 日本語 | 日本の業務システム向け |

## プロジェクト構成

```
workflow-app/
├── pnpm-workspace.yaml        # pnpmワークスペース定義
├── turbo.json                 # Turborepo設定
├── package.json               # ルートpackage.json
├── tsconfig.base.json         # 共通TypeScript設定
├── docker-compose.yml         # DynamoDB Local
├── apps/
│   ├── web/                   # React SPA (Vite)
│   │   ├── src/
│   │   │   ├── components/    # UIコンポーネント
│   │   │   ├── pages/         # ページコンポーネント
│   │   │   ├── hooks/         # TanStack Query hooks
│   │   │   ├── stores/        # Zustand stores
│   │   │   └── lib/           # APIクライアント等
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                   # Hono backend
│       ├── src/
│       │   ├── routes/        # APIルート
│       │   ├── services/      # ビジネスロジック
│       │   ├── repositories/  # DynamoDBアクセス層
│       │   ├── middleware/    # 認証等
│       │   ├── scripts/       # DB setup/seed
│       │   ├── local.ts       # ローカル開発サーバー
│       │   └── lambda.ts      # Lambda用ハンドラー
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                # 共有型定義 + Zodスキーマ
│       ├── src/
│       │   ├── schemas.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── infra/                     # Terraform
│   ├── modules/
│   │   ├── frontend/          # S3 + CloudFront
│   │   ├── api/               # API Gateway + Lambda
│   │   ├── database/          # DynamoDB
│   │   └── auth/              # Cognito
│   └── environments/
│       ├── dev/
│       └── prod/
└── scripts/
    └── deploy.sh              # デプロイスクリプト
```

## データモデル (DynamoDB Single-Table Design)

### エンティティ

- **WorkflowTemplate**: ワークフローテンプレート（ステップ定義）
- **TaskPattern**: タスクパターン（テンプレートに紐づく）
- **WorkflowInstance**: ワークフローインスタンス
- **Task**: タスク（todo/in_progress/review/done）
- **ApprovalStep**: 承認ステップ（pending/approved/rejected）

### キー設計

| エンティティ | PK | SK | GSI1 | GSI2 |
|-------------|----|----|------|------|
| Template | `TMPL#<id>` | `TMPL#<id>` | `TMPL` / `<createdAt>` | - |
| TaskPattern | `TMPL#<templateId>` | `TPAT#<id>` | - | - |
| Workflow | `WF#<id>` | `WF#<id>` | `TMPL#<templateId>` / `WF#<createdAt>` | `WF_STATUS#<status>` / `<updatedAt>` |
| Task | `WF#<workflowId>` | `TASK#<id>` | `TASK_ASSIGNEE#<assignee>` / `<updatedAt>` | `TASK_STATUS#<status>` / `<updatedAt>` |
| Approval | `WF#<workflowId>` | `APPR#<order>#<id>` | `APPR_APPROVER#<approver>` / `<createdAt>` | `APPR_STATUS#<status>` / `<createdAt>` |

## セットアップ手順

### 前提条件

- Node.js 20以上
- Docker & Docker Compose
- pnpm (`npm install -g pnpm`)
- AWS CLI（デプロイ時）
- Terraform（デプロイ時）

### WSL2での注意事項

**重要**: WSL2環境では、Windowsマウント(`/mnt/c/`)上で`pnpm install`を実行すると権限エラーが発生します。

**回避策**: プロジェクトをLinuxネイティブパス（`/tmp/`等）にコピーして作業します。

```bash
# プロジェクトをLinuxファイルシステムにコピー
cp -r /mnt/c/develop/project/test_1/workflow-app /tmp/workflow-app
cd /tmp/workflow-app

# 以降の作業は/tmp/workflow-appで実施
```

### 1. 依存関係のインストール

```bash
cd /tmp/workflow-app
pnpm install
```

### 2. DynamoDB Localの起動

```bash
# Dockerグループに追加（初回のみ）
sudo usermod -aG docker $USER
newgrp docker

# DynamoDB Local起動
docker compose up -d

# 動作確認
docker ps
```

### 3. データベースのセットアップ

```bash
# テーブル作成
pnpm db:setup

# サンプルデータ投入
pnpm db:seed
```

**サンプルテンプレート**:
- 休暇申請（申請 → 上長承認 → 人事確認 → 完了）
- 購買申請（見積作成 → 上長承認 → 経理承認 → 発注 → 完了）
- バグ修正（報告 → トリアージ → 修正 → レビュー → テスト → 完了）

### 4. アプリケーションの起動

```bash
# 開発サーバー起動（API + Web）
pnpm dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:3001

## 画面構成

| パス | 画面 | 内容 |
|-----|------|------|
| `/` | ダッシュボード | 自分のタスク、未承認件数、最近のワークフロー |
| `/templates` | テンプレート一覧 | テンプレートのリスト表示 |
| `/templates/new` | テンプレート作成 | ステップ＋タスクパターン編集 |
| `/templates/:id` | テンプレート詳細/編集 | 閲覧・編集 |
| `/workflows` | ワークフロー一覧 | ステータスフィルタ付きリスト |
| `/workflows/new` | ワークフロー作成 | テンプレート選択→インスタンス生成 |
| `/workflows/:id` | ワークフロー詳細 | タイムライン、タスク、承認状況 |
| `/kanban` | カンバンボード | ドラッグ&ドロップでタスク管理 |
| `/approvals` | 承認キュー | 未承認の承認リクエスト一覧 |

## 開発コマンド

```bash
# すべてをビルド
pnpm run build

# 開発サーバー起動
pnpm dev

# 個別パッケージのビルド
pnpm --filter @workflow-app/shared build
pnpm --filter @workflow-app/api build
pnpm --filter @workflow-app/web build

# DynamoDB操作
pnpm db:setup   # テーブル作成
pnpm db:seed    # サンプルデータ投入
```

## AWSデプロイ

### インフラ構成

```
ユーザー → CloudFront → S3 (React SPA)
                      ↘
                       API Gateway (HTTP API) → Lambda (Hono) → DynamoDB
```

### 推定月額コスト（低トラフィック時）

| サービス | 月額 |
|---------|------|
| DynamoDB (on-demand, 無料枠) | $0 |
| Lambda (無料枠: 100万リクエスト/月) | $0 |
| API Gateway HTTP API | $0〜$1 |
| S3 + CloudFront | ~$0.10 |
| **合計** | **~$0.10/月** |

### デプロイ手順

```bash
cd /tmp/workflow-app

# 開発環境にデプロイ
bash scripts/deploy.sh dev

# 本番環境にデプロイ
bash scripts/deploy.sh prod
```

**前提条件**:
- AWS CLIの設定済み（`aws configure`）
- Terraform インストール済み
- 適切なIAM権限（DynamoDB、Lambda、S3、CloudFront、API Gateway、Cognito）

### デプロイ後の確認

```bash
cd infra/environments/dev  # または prod
terraform output
```

出力例：
```
api_url = "https://xxxxxxx.execute-api.ap-northeast-1.amazonaws.com"
cloudfront_domain = "xxxxxxx.cloudfront.net"
cognito_user_pool_id = "ap-northeast-1_xxxxxxx"
cognito_client_id = "xxxxxxx"
```

CloudFrontのドメインにブラウザでアクセスして動作確認します。

## 実装フェーズ

### Phase 1: プロジェクト基盤構築 ✅
- pnpm workspace + Turborepo セットアップ
- shared パッケージ（型定義 + Zodスキーマ）
- API基盤（Hono + DynamoDB接続）
- Web基盤（Vite + React + Tailwind + shadcn/ui）
- docker-compose.yml（DynamoDB Local）
- テーブル作成スクリプト + シードデータ

### Phase 2: ワークフローテンプレートCRUD ✅
- AppLayout（サイドバー + ヘッダー）
- テンプレート一覧ページ
- テンプレート作成/編集ページ（ステップエディタ + タスクパターンエディタ）
- TanStack Query hooks + Hono RPCクライアント

### Phase 3: ワークフローインスタンス作成 ✅
- テンプレートからインスタンス生成（タスク自動作成）
- ワークフロー一覧ページ（ステータスフィルタ）
- ワークフロー詳細ページ（タイムライン表示）

### Phase 4: タスク管理 + カンバンボード ✅
- カンバンボード（@dnd-kit、4列: Todo/In Progress/Review/Done）
- オプティミスティック更新（スムーズなドラッグ体験）
- タスクフィルタリング（担当者、ワークフロー、優先度）
- ダッシュボードページ

### Phase 5: 承認フロー ✅
- 承認キューページ
- 承認/却下アクション
- 承認完了時のワークフロー自動進行
- エンドツーエンドフロー検証

### Phase 6: AWS Cognito認証 ✅
- Cognito User Pool作成（Terraform）
- モック認証ミドルウェア（Phase 1-5用）
- JWT検証への切り替え準備完了

### Phase 7: Terraform + AWSデプロイ ✅
- Terraformモジュール実装（frontend, api, database, auth）
- Lambda デプロイパッケージ作成（esbuild）
- デプロイスクリプト作成
- dev/prod環境分離

## トラブルシューティング

### pnpm installでEPERMエラー

**原因**: WSL2のWindowsマウント上で実行権限の設定ができない

**解決策**:
```bash
cp -r /mnt/c/develop/project/test_1/workflow-app /tmp/workflow-app
cd /tmp/workflow-app
pnpm install
```

### Docker permission deniedエラー

**解決策**:
```bash
# ユーザーをdockerグループに追加
sudo usermod -aG docker $USER
newgrp docker

# または一時的にsudoで実行
sudo docker compose up -d
```

### DynamoDB Localに接続できない

**確認事項**:
```bash
# Dockerコンテナが起動しているか確認
docker ps

# ポート8000が使用されているか確認
netstat -an | grep 8000

# コンテナログを確認
docker logs workflow-dynamodb
```

### ビルドエラー

```bash
# キャッシュをクリア
rm -rf node_modules .turbo
pnpm install
pnpm run build
```

## API仕様

### テンプレート
- `GET /api/templates` - テンプレート一覧
- `POST /api/templates` - テンプレート作成
- `GET /api/templates/:id` - テンプレート取得
- `PUT /api/templates/:id` - テンプレート更新
- `DELETE /api/templates/:id` - テンプレート削除
- `GET /api/templates/:id/patterns` - タスクパターン一覧
- `POST /api/templates/:id/patterns` - タスクパターン作成

### ワークフロー
- `GET /api/workflows` - ワークフロー一覧
- `POST /api/workflows` - ワークフロー作成（テンプレートから）
- `GET /api/workflows/:id` - ワークフロー詳細
- `DELETE /api/workflows/:id` - ワークフロー削除
- `PATCH /api/workflows/:id/status` - ステータス更新

### タスク
- `GET /api/tasks` - タスク一覧（フィルタ可）
- `PATCH /api/tasks/:id` - タスク更新
- `PATCH /api/tasks/:id/status` - ステータス更新

### 承認
- `GET /api/approvals` - 承認待ち一覧
- `POST /api/approvals/:id/approve` - 承認
- `POST /api/approvals/:id/reject` - 却下

## 今後の拡張案

- [ ] Cognito JWTベリフィケーションの実装
- [ ] ユニットテスト（Jest/Vitest）
- [ ] E2Eテスト（Playwright）
- [ ] CI/CD（GitHub Actions）
- [ ] CloudWatch監視ダッシュボード
- [ ] メール通知（SES）
- [ ] ファイル添付機能（S3）
- [ ] コメント機能
- [ ] 監査ログ
- [ ] ロールベースアクセス制御の強化

## ライセンス

Private

## 作成者

Claude Code + ユーザー

---

**ドキュメント作成日**: 2026-02-07
