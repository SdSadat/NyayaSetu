variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket containing legal documents"
  type        = string
}

variable "bedrock_kb_role_arn" {
  description = "IAM role ARN for Bedrock Knowledge Base"
  type        = string
}

variable "embedding_model_id" {
  description = "Nova embedding model ID"
  type        = string
  default     = "amazon.nova-embed-multimodal-v1:0"
}

variable "embedding_dimension" {
  description = "Embedding vector dimension"
  type        = number
  default     = 1024
}
