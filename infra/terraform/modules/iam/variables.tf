variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for legal documents"
  type        = string
}

variable "dynamodb_history_arn" {
  description = "ARN of the Drishti history DynamoDB table"
  type        = string
}

variable "dynamodb_users_arn" {
  description = "ARN of the Users DynamoDB table"
  type        = string
}

variable "dynamodb_progress_arn" {
  description = "ARN of the User Progress DynamoDB table"
  type        = string
}

variable "dynamodb_shares_arn" {
  description = "ARN of the Shares DynamoDB table"
  type        = string
}
