variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "history_ttl_days" {
  description = "TTL for history records in days"
  type        = number
  default     = 30
}
