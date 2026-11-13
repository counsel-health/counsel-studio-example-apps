variable "gcp_project_id" {
  description = "GCP project that hosts the demo apps. No default: the repo is public, the Terraform Cloud workspace supplies it"
  type        = string
}

variable "gcp_region" {
  description = "GCP region where resources will be created"
  type        = string
  default     = "us-east1"
}
