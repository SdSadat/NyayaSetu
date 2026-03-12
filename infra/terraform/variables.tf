# =============================================================================
# Input Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "history_ttl_days" {
  description = "Days before Drishti history records are auto-deleted (DynamoDB TTL)"
  type        = number
  default     = 30
}

# NOTE: embedding_model_id and embedding_dimension removed — Bedrock KB
# module disabled (requires OpenSearch Serverless paid subscription).
