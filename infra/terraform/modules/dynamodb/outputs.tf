output "history_table_name" {
  description = "Drishti history table name"
  value       = aws_dynamodb_table.drishti_history.name
}

output "history_table_arn" {
  description = "Drishti history table ARN"
  value       = aws_dynamodb_table.drishti_history.arn
}

output "users_table_name" {
  description = "Users table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "Users table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "progress_table_name" {
  description = "User progress table name"
  value       = aws_dynamodb_table.user_progress.name
}

output "progress_table_arn" {
  description = "User progress table ARN"
  value       = aws_dynamodb_table.user_progress.arn
}
