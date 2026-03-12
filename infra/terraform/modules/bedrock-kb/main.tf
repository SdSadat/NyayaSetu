# =============================================================================
# Bedrock Knowledge Base — Managed RAG with Nova Embeddings
# =============================================================================
# Creates a Knowledge Base backed by an S3 data source containing legal
# documents. Bedrock handles chunking, embedding (Nova), and vector storage
# automatically via OpenSearch Serverless.
# =============================================================================

# -----------------------------------------------------------------------------
# OpenSearch Serverless Collection (vector store for Bedrock KB)
# -----------------------------------------------------------------------------

resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "nyayasetu-kb-enc-${var.environment}"
  type = "encryption"

  policy = jsonencode({
    Rules = [
      {
        Resource     = ["collection/nyayasetu-kb-${var.environment}"]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "network" {
  name = "nyayasetu-kb-net-${var.environment}"
  type = "network"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/nyayasetu-kb-${var.environment}"]
          ResourceType = "collection"
        }
      ]
      AllowFromPublic = true
    }
  ])
}

resource "aws_opensearchserverless_access_policy" "data" {
  name = "nyayasetu-kb-data-${var.environment}"
  type = "data"

  policy = jsonencode([
    {
      Rules = [
        {
          Resource     = ["collection/nyayasetu-kb-${var.environment}"]
          ResourceType = "collection"
          Permission   = [
            "aoss:CreateCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
        },
        {
          Resource     = ["index/nyayasetu-kb-${var.environment}/*"]
          ResourceType = "index"
          Permission   = [
            "aoss:CreateIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
        }
      ]
      Principal = [var.bedrock_kb_role_arn]
    }
  ])
}

resource "aws_opensearchserverless_collection" "kb_vectors" {
  name = "nyayasetu-kb-${var.environment}"
  type = "VECTORSEARCH"

  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
    aws_opensearchserverless_access_policy.data,
  ]
}

# -----------------------------------------------------------------------------
# Bedrock Knowledge Base
# -----------------------------------------------------------------------------

resource "aws_bedrockagent_knowledge_base" "legal" {
  name     = "nyayasetu-legal-kb-${var.environment}"
  role_arn = var.bedrock_kb_role_arn

  knowledge_base_configuration {
    type = "VECTOR"

    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:${var.aws_region}::foundation-model/${var.embedding_model_id}"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"

    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.kb_vectors.arn
      vector_index_name = "nyayasetu-legal-index"

      field_mapping {
        vector_field   = "embedding"
        text_field     = "text"
        metadata_field = "metadata"
      }
    }
  }
}

# -----------------------------------------------------------------------------
# S3 Data Source for the Knowledge Base
# -----------------------------------------------------------------------------

resource "aws_bedrockagent_data_source" "s3_legal_docs" {
  name                 = "legal-documents"
  knowledge_base_id    = aws_bedrockagent_knowledge_base.legal.id

  data_source_configuration {
    type = "S3"

    s3_configuration {
      bucket_arn = var.s3_bucket_arn
    }
  }
}
