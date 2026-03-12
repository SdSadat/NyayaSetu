# =============================================================================
# Outputs
# =============================================================================

output "dynamodb_history_table" {
  description = "DynamoDB table name for Drishti history"
  value       = module.dynamodb.history_table_name
}

output "dynamodb_users_table" {
  description = "DynamoDB table name for users"
  value       = module.dynamodb.users_table_name
}

output "dynamodb_progress_table" {
  description = "DynamoDB table name for user progress"
  value       = module.dynamodb.progress_table_name
}

output "s3_legal_docs_bucket" {
  description = "S3 bucket for legal documents (Bedrock KB data source)"
  value       = module.s3.bucket_name
}

output "app_role_arn" {
  description = "IAM role ARN for the NyayaSetu application"
  value       = module.iam.app_role_arn
}
