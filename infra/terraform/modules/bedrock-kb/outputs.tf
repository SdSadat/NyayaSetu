output "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID — use as BEDROCK_KB_ID env var"
  value       = aws_bedrockagent_knowledge_base.legal.id
}

output "knowledge_base_arn" {
  description = "Bedrock Knowledge Base ARN"
  value       = aws_bedrockagent_knowledge_base.legal.arn
}

output "data_source_id" {
  description = "Bedrock KB data source ID"
  value       = aws_bedrockagent_data_source.s3_legal_docs.data_source_id
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = aws_opensearchserverless_collection.kb_vectors.collection_endpoint
}
