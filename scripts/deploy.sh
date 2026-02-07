#!/bin/bash
set -euo pipefail

ENV="${1:-dev}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== ワークフロー管理アプリ デプロイ ($ENV) ==="

# 1. Build all packages
echo "--- ビルド中..."
cd "$ROOT_DIR"
pnpm run build

# 2. Package Lambda
echo "--- Lambda パッケージ作成..."
cd "$ROOT_DIR/apps/api/dist"
cp lambda.js lambda.mjs
zip -j lambda.zip lambda.mjs
rm lambda.mjs

# 3. Terraform apply
echo "--- Terraform apply ($ENV)..."
cd "$ROOT_DIR/infra/environments/$ENV"
terraform init
terraform apply -var="lambda_zip_path=$ROOT_DIR/apps/api/dist/lambda.zip" -auto-approve

# 4. Get outputs
S3_BUCKET=$(terraform output -raw s3_bucket_name)
CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id)

# 5. Deploy frontend to S3
echo "--- フロントエンドを S3 にアップロード..."
aws s3 sync "$ROOT_DIR/apps/web/dist/" "s3://$S3_BUCKET/" --delete

# 6. Invalidate CloudFront cache
echo "--- CloudFront キャッシュ無効化..."
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo "=== デプロイ完了 ==="
terraform output
