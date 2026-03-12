# =============================================================================
# DynamoDB Tables — Drishti History + Users + User Progress
# =============================================================================

# --- Drishti History Table ---
# PK: sessionId (String), SK: savedAt (String), TTL: expiresAt
resource "aws_dynamodb_table" "drishti_history" {
  name         = "NyayaSetu-DrishtiHistory-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"
  range_key    = "savedAt"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "savedAt"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = {
    Name = "NyayaSetu-DrishtiHistory-${var.environment}"
  }
}

# --- Users Table ---
# PK: username (String), no sort key
resource "aws_dynamodb_table" "users" {
  name         = "NyayaSetu-Users-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "username"

  attribute {
    name = "username"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = {
    Name = "NyayaSetu-Users-${var.environment}"
  }
}

# --- User Progress Table ---
# PK: username (String), SK: lessonId (String)
# Stores lesson completion, quiz scores, and spaced repetition data
resource "aws_dynamodb_table" "user_progress" {
  name         = "NyayaSetu-UserProgress-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "username"
  range_key    = "lessonId"

  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "lessonId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.environment == "prod"
  }

  tags = {
    Name = "NyayaSetu-UserProgress-${var.environment}"
  }
}
