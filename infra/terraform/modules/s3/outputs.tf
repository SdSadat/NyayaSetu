output "bucket_name" {
  description = "S3 bucket name for legal documents"
  value       = aws_s3_bucket.legal_docs.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.legal_docs.arn
}
