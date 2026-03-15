# =============================================================================
# NyayaSetu — AWS Infrastructure (Terraform)
# =============================================================================
# Provisions all AWS resources for the NyayaSetu legal intelligence platform:
#   - DynamoDB tables (Drishti history, Users, User Progress)
#   - S3 bucket for legal documents
#   - IAM roles and policies
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure via backend config or CLI:
    #   terraform init -backend-config="bucket=nyayasetu-tf-state" \
    #                  -backend-config="region=us-east-1"
    key = "terraform/nyayasetu.tfstate"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "NyayaSetu"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Modules
# -----------------------------------------------------------------------------

module "dynamodb" {
  source = "./modules/dynamodb"

  environment        = var.environment
  history_ttl_days   = var.history_ttl_days
}

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  aws_region  = var.aws_region
}

module "iam" {
  source = "./modules/iam"

  environment            = var.environment
  s3_bucket_arn          = module.s3.bucket_arn
  dynamodb_history_arn   = module.dynamodb.history_table_arn
  dynamodb_users_arn     = module.dynamodb.users_table_arn
  dynamodb_progress_arn  = module.dynamodb.progress_table_arn
  dynamodb_shares_arn    = module.dynamodb.shares_table_arn
}

# NOTE: Bedrock Knowledge Base module removed — OpenSearch Serverless
# requires a paid subscription (~$700/month minimum). For the hackathon,
# use ChromaDB locally for vector retrieval. Bedrock Nova LLM still works.
# Re-enable when upgrading to a paid AWS plan.
