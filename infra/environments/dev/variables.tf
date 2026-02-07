variable "aws_region" {
  type    = string
  default = "ap-northeast-1"
}

variable "lambda_zip_path" {
  type    = string
  default = "../../../apps/api/dist/lambda.zip"
}
