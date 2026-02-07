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

- Node.js 20以上（動作確認済み: v24.13.0）
- Docker Desktop for Windows
- pnpm 9.x（`npm install -g pnpm@9`、または `npx pnpm@9.15.0` で代用可）
- AWS CLI（デプロイ時のみ）
- Terraform（デプロイ時のみ）

### 1. 依存関係のインストール

```bash
cd workflow-app
pnpm install
```

### 2. DynamoDB Localの起動

Docker Desktopが起動していることを確認してから実行してください。

```bash
# DynamoDB Local起動
docker compose up -d

# 動作確認
docker ps
# CONTAINER ID  IMAGE                         PORTS                    NAMES
# xxxxxxxxxxxx  amazon/dynamodb-local:latest   0.0.0.0:8000->8000/tcp   workflow-dynamodb
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
# 開発サーバー起動（API + Web を同時に起動）
pnpm dev
```

| サービス | URL | 説明 |
|---------|-----|------|
| Web（フロントエンド） | http://localhost:5173 | React SPA（Vite） |
| API（バックエンド） | http://localhost:3001 | Hono REST API |
| DynamoDB Local | http://localhost:8000 | Dockerコンテナ |

> **Note**: ポート5173が使用中の場合、Viteは自動的に5174等の別ポートを使用します。

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
# 開発サーバー起動（API + Web）
pnpm dev

# すべてをビルド
pnpm run build

# 個別パッケージのビルド
pnpm --filter @workflow-app/shared build
pnpm --filter @workflow-app/api build
pnpm --filter @workflow-app/web build

# DynamoDB操作
pnpm db:setup   # テーブル作成
pnpm db:seed    # サンプルデータ投入

# Docker操作
pnpm db:start   # DynamoDB Localコンテナ起動
pnpm db:stop    # DynamoDB Localコンテナ停止
```

## AWSデプロイ

### インフラ構成

```
ユーザー → CloudFront → S3 (React SPA)
                      ↘ /api/*
                       API Gateway (HTTP API) → Lambda (Hono) → DynamoDB
                       Cognito User Pool（認証基盤）
```

CloudFrontがフロントエンド配信とAPIプロキシを統合し、単一ドメインでSPAとAPIの両方を提供します。

### 作成されるAWSリソース（17個）

| サービス | リソース | 説明 |
|---------|---------|------|
| DynamoDB | テーブル (PAY_PER_REQUEST) | GSI×2、Single-Table Design |
| Lambda | 関数 (Node.js 20, 256MB) | Honoアプリ、30秒タイムアウト |
| IAM | ロール + ポリシー×2 | Lambda実行ロール、DynamoDBアクセス権限 |
| API Gateway | HTTP API (v2) | ルート + ステージ + Lambda統合 |
| S3 | バケット | フロントエンド静的ファイル、パブリックアクセスブロック有効 |
| CloudFront | ディストリビューション + OAI | S3オリジン + APIオリジン、SPA用403/404→index.htmlフォールバック |
| Cognito | User Pool + Client | メール認証、OAuth 2.0コードフロー |

### 推定月額コスト（低トラフィック時）

| サービス | 月額 |
|---------|------|
| DynamoDB (on-demand, 無料枠) | $0 |
| Lambda (無料枠: 100万リクエスト/月) | $0 |
| API Gateway HTTP API (無料枠: 100万リクエスト/月) | $0 |
| S3 + CloudFront (無料枠: 1TBデータ転送/月) | ~$0.02 |
| Cognito (無料枠: 50,000 MAU) | $0 |
| CloudWatch Logs | ~$0.01 |
| **合計** | **~$0.03/月** |

> **Note**: 上記はAWS無料利用枠の適用を前提としています。無料枠を超えた場合でもテスト用途なら月額$1未満です。

### 前提条件

- **AWS CLI** の設定済み（`aws configure` でプロファイル設定）
- **Terraform** インストール済み（`winget install Hashicorp.Terraform` 等）
- 適切な**IAM権限**（DynamoDB、Lambda、S3、CloudFront、API Gateway、Cognito、IAM、CloudWatch Logs）

### AWSプロファイルの設定

`infra/environments/dev/main.tf` の `provider` ブロックに使用するAWSプロファイルを指定します:

```hcl
provider "aws" {
  region  = var.aws_region
  profile = "your-profile-name"   # ← 自身のプロファイル名に変更
}
```

### デプロイ手順

#### 一括デプロイ（deploy.sh）

```bash
bash scripts/deploy.sh dev   # 開発環境
bash scripts/deploy.sh prod  # 本番環境
```

> **Note**: `deploy.sh` はビルド → Lambda ZIP作成 → Terraform apply → S3アップロード → CloudFrontキャッシュ無効化を一括実行します。初回はTerraform initを自動実行します。

#### 手動デプロイ（ステップごと）

```bash
# 1. プロジェクトビルド（shared → api → web の順に実行される）
pnpm run build

# 2. Lambda ZIP作成
cd apps/api/dist
cp lambda.js lambda.mjs
zip -j lambda.zip lambda.mjs
rm lambda.mjs

# 3. Terraform init（初回のみ）
cd infra/environments/dev
terraform init

# 4. Terraform plan（変更内容の確認）
terraform plan -var="lambda_zip_path=$(pwd)/../../../apps/api/dist/lambda.zip"

# 5. Terraform apply（リソース作成・更新）
terraform apply -var="lambda_zip_path=$(pwd)/../../../apps/api/dist/lambda.zip"

# 6. フロントエンドをS3にアップロード
aws s3 sync apps/web/dist/ s3://$(terraform output -raw s3_bucket_name)/ --delete --profile your-profile-name

# 7. CloudFrontキャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*" \
  --profile your-profile-name
```

#### Windows PowerShellでのLambda ZIP作成

Linux/macOSの `zip` コマンドが使えない場合:

```powershell
cd apps\api\dist
Copy-Item lambda.js lambda.mjs
Compress-Archive -Path lambda.mjs -DestinationPath lambda.zip -Force
Remove-Item lambda.mjs
```

#### Lambda関数のみ更新（コード変更時）

インフラ変更がなくAPIコードのみ変更した場合、Terraformを経由せずLambdaを直接更新できます:

```bash
# ビルド → ZIP作成後
aws lambda update-function-code \
  --function-name workflow-app-dev-api \
  --zip-file fileb://apps/api/dist/lambda.zip \
  --profile your-profile-name
```

### デプロイ後の確認

```bash
cd infra/environments/dev  # または prod
terraform output
```

表示される値:
- `api_url` — API GatewayエンドポイントURL
- `cloudfront_domain` — CloudFrontドメイン（ブラウザでアクセス）
- `cloudfront_distribution_id` — CloudFrontディストリビューションID
- `s3_bucket_name` — フロントエンド用S3バケット名
- `cognito_user_pool_id` — Cognito User Pool ID
- `cognito_client_id` — Cognito Client ID
- `dynamodb_table_name` — DynamoDBテーブル名

CloudFrontドメインにブラウザでアクセスしてUIの表示を確認し、`/api/templates` 等のAPIエンドポイントが正常に応答することを確認します。

### リソースの削除

```bash
cd infra/environments/dev
terraform destroy
```

> **Warning**: S3バケットにオブジェクトが残っている場合は先に削除が必要です:
> ```bash
> aws s3 rm s3://$(terraform output -raw s3_bucket_name) --recursive --profile your-profile-name
> terraform destroy
> ```

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

### Git Bashでdockerコマンドが見つからない

**原因**: Docker DesktopのPATHがGit Bashのシェルに反映されていない

**解決策**:
```bash
# PATHに追加（セッション中のみ有効）
export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"

# または PowerShell から実行する
docker compose up -d
```

### pnpm dev起動時に「Cannot find module @workflow-app/shared/dist/index.js」

**原因**: sharedパッケージのビルド成果物（`dist/`）が未生成の状態でAPIサーバーが起動しようとした

**解決策**: `turbo.json`のdevタスクに`"dependsOn": ["^build"]`が設定されていることを確認してください。手動で解決する場合:
```bash
# sharedパッケージを先にビルド
pnpm --filter @workflow-app/shared build

# その後dev起動
pnpm dev
```

### DynamoDB Localに接続できない

**確認事項**:
```bash
# Docker Desktopが起動しているか確認
docker ps

# コンテナが動いていなければ起動
docker compose up -d

# コンテナログを確認
docker logs workflow-dynamodb
```

### ビルドエラー

```bash
# キャッシュとnode_modulesをクリアして再インストール
rm -rf node_modules .turbo apps/*/node_modules packages/*/node_modules
pnpm install
pnpm run build
```

### Git BashでTerraformコマンドが見つからない（Windows）

**原因**: `winget install` 後にPATHがGit Bashセッションに反映されない

**解決策**:
```bash
# PATHにTerraformの場所を追加
export PATH="$PATH:$(find /c/Users/$(whoami)/AppData/Local/Microsoft/WinGet/Packages -name 'terraform.exe' -printf '%h' 2>/dev/null)"

# 確認
terraform --version
```

### Git BashでAWS CLIのパスが変換される（Windows）

**原因**: Git BashのMSYS2が `/aws/lambda/...` のようなパスをWindowsパスに自動変換する

**解決策**:
```bash
# MSYS_NO_PATHCONV=1 を先頭に付けてパス変換を無効化
MSYS_NO_PATHCONV=1 aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/workflow-app-dev-api"
```

### Lambda起動時に「secure crypto unusable」エラー

**原因**: `ulid` パッケージ (UMDフォーマット) がesbuildのESMバンドル内でNode.jsの`crypto`モジュールを検出できない

**解決策**: `apps/api/package.json` のビルドコマンドにバナーオプションを追加:
```json
"build": "esbuild src/lambda.ts --bundle --platform=node --target=node20 --outdir=dist --format=esm --external:@aws-sdk --banner:js=\"import crypto from 'node:crypto'; if (typeof window === 'undefined') { globalThis.window = { crypto }; }\""
```

### Lambdaが「connect ECONNREFUSED 127.0.0.1:8000」エラー

**原因**: DynamoDBクライアントの接続先がローカル開発用の `localhost:8000` にハードコードされている

**解決策**: `apps/api/src/db.ts` でDynamoDBClientの設定が環境変数 `DYNAMODB_ENDPOINT` の有無で切り替わるようにする:
```typescript
const client = new DynamoDBClient(
  isLocal
    ? { endpoint: process.env.DYNAMODB_ENDPOINT, region: "ap-northeast-1", credentials: { accessKeyId: "local", secretAccessKey: "local" } }
    : { region: process.env.AWS_REGION || "ap-northeast-1" }
);
```

### S3バケット名の競合

**原因**: S3バケット名はグローバルに一意である必要がある

**解決策**: `infra/environments/dev/main.tf` の `bucket_name` にアカウントIDやサフィックスを追加:
```hcl
module "frontend" {
  bucket_name  = "${local.project_name}-frontend-${data.aws_caller_identity.current.account_id}"
}
```

### CloudFrontディストリビューションの作成が遅い

CloudFrontディストリビューションの作成・更新には数分〜15分かかることがあります。`terraform apply` 中に `Still creating...` と表示されますが、正常な動作です。

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
