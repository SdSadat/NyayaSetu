output "app_role_arn" {
  description = "IAM role ARN for the NyayaSetu application"
  value       = aws_iam_role.app.arn
}
