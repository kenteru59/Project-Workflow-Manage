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
  #   key    = "workflow-app/prod/terraform.tfstate"
  #   region = "ap-northeast-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "workflow-app"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project_name = "workflow-app-prod"
  tags = {
    Project     = "workflow-app"
    Environment = "prod"
  }
}

module "database" {
  source      = "../../modules/database"
  table_name  = "${local.project_name}-table"
  enable_pitr = true
  tags        = local.tags
}

module "api" {
  source              = "../../modules/api"
  project_name        = local.project_name
  dynamodb_table_arn  = module.database.table_arn
  dynamodb_table_name = module.database.table_name
  lambda_zip_path     = var.lambda_zip_path
  cors_origins        = ["https://${module.frontend.cloudfront_domain}"]
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
    "https://${module.frontend.cloudfront_domain}/callback",
  ]
  logout_urls = [
    "https://${module.frontend.cloudfront_domain}/",
  ]
  tags = local.tags
}
