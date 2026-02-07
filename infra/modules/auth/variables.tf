variable "project_name" {
  type = string
}

variable "callback_urls" {
  type    = list(string)
  default = ["http://localhost:5173/callback"]
}

variable "logout_urls" {
  type    = list(string)
  default = ["http://localhost:5173/"]
}

variable "tags" {
  type    = map(string)
  default = {}
}
