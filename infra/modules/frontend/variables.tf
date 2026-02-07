variable "project_name" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "api_url" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
