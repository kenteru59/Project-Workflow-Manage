variable "table_name" {
  type    = string
  default = "WorkflowApp"
}

variable "enable_pitr" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
