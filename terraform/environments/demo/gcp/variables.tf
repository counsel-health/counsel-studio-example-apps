variable "gcp_project_id" {
  description = "GCP project that hosts the demo apps. No default: the repo is public, the Terraform Cloud workspace supplies it"
  type        = string
}

variable "gcp_region" {
  description = "GCP region where resources will be created"
  type        = string
  default     = "us-east1"
}

variable "secret_prefix" {
  description = "Prefix that the Doppler sync puts on every Secret Manager secret"
  type        = string
  default     = "doppler-gsm-sync"
}

variable "bootstrap_image" {
  description = "Image for the first create of a service. CD sets the real image afterwards, and Terraform ignores image changes"
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
}

variable "services" {
  description = "Cloud Run services, keyed by service name. secret_env lists the env vars that come from Doppler-synced secrets of the same name"
  type = map(object({
    port            = number
    cpu             = string
    memory          = string
    min_instances   = number
    max_instances   = number
    concurrency     = number
    timeout_seconds = optional(number, 300)
    # true skips the Cloud Run invoker IAM check for the service.
    invoker_iam_disabled = optional(bool, false)
    secret_env           = list(string)
  }))
  default = {
    embedded-demo-nextjs-web = {
      port          = 3001
      cpu           = "2"
      memory        = "4Gi"
      min_instances = 3
      max_instances = 25
      concurrency   = 40
      secret_env    = ["SERVER_HOST", "IRON_SESSION_PASSWORD"]
    }
    embedded-demo-nodejs-server = {
      port                 = 4003
      cpu                  = "1000m"
      memory               = "512Mi"
      min_instances        = 1
      max_instances        = 5
      concurrency          = 1000
      invoker_iam_disabled = true
      secret_env           = ["ACCESS_CODE_CONFIGS", "JWT_SECRET", "COUNSEL_WEBHOOK_SECRET", "COUNSEL_PRIVATE_KEY_PEM"]
    }
  }
}

variable "domain_mappings" {
  description = "Custom domains, mapped to the service name that serves them"
  type        = map(string)
  default = {
    "studio-demo.counselhealth.com"   = "embedded-demo-nextjs-web"
    "embedded-demo.counselhealth.com" = "embedded-demo-nextjs-web"
  }
}
