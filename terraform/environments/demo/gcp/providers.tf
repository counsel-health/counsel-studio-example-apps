data "google_project" "current" {
  project_id = var.gcp_project_id
}

locals {
  registry_url = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.embedded_demo.repository_id}"

  # Both services run as the default compute account today.
  runtime_service_account = "${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}
