# =============================================================================
# S3 — Legal Documents Bucket (Bedrock KB Data Source)
# =============================================================================

resource "aws_s3_bucket" "legal_docs" {
  bucket = "nyayasetu-legal-docs-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "NyayaSetu Legal Documents"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_versioning" "legal_docs" {
  bucket = aws_s3_bucket.legal_docs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "legal_docs" {
  bucket = aws_s3_bucket.legal_docs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "legal_docs" {
  bucket = aws_s3_bucket.legal_docs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule: move old versions to IA after 30 days
resource "aws_s3_bucket_lifecycle_configuration" "legal_docs" {
  bucket = aws_s3_bucket.legal_docs.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}
