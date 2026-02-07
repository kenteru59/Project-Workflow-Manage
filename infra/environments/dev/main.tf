terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "workflow-app/dev/terraform.tfstate"
  #   region = "ap-northeast-1"
  # }
}

provider "aws" {
  region  = var.aws_region
  profile = "sandbox-developer"

  default_tags {
    tags = {
      Project     = "workflow-app"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project_name = "workflow-app-dev"
  tags = {
    Project     = "workflow-app"
    Environment = "dev"
  }
}

module "database" {
  source     = "../../modules/database"
  table_name = "${local.project_name}-table"
  tags       = local.tags
}

module "api" {
  source              = "../../modules/api"
  project_name        = local.project_name
  dynamodb_table_arn  = module.database.table_arn
  dynamodb_table_name = module.database.table_name
  lambda_zip_path     = var.lambda_zip_path
  cors_origins        = ["*"]
  tags                = local.tags
}

module "frontend" {
  source       = "../../modules/frontend"
  project_name = local.project_name
  bucket_name  = "${local.project_name}-frontend"
  api_url      = module.api.api_url
  tags         = local.tags
}

module "auth" {
  source       = "../../modules/auth"
  project_name = local.project_name
  callback_urls = [
    "http://localhost:5173/callback",
    "https://${module.frontend.cloudfront_domain}/callback",
  ]
  logout_urls = [
    "http://localhost:5173/",
    "https://${module.frontend.cloudfront_domain}/",
  ]
  tags = local.tags
}
