output "table_name" {
  value = aws_dynamodb_table.workflow_app.name
}

output "table_arn" {
  value = aws_dynamodb_table.workflow_app.arn
}
