terraform {
  cloud {
    organization = "Counsel-health"

    workspaces {
      name = "counsel-studio-example-apps-demo-gcp"
    }
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  required_version = "1.14.3"
}
