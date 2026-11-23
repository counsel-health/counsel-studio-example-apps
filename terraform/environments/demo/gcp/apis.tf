# Terraform Cloud needs cloudresourcemanager and serviceusage to read the project and its APIs.
locals {
  apis = toset([
    "artifactregistry.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "serviceusage.googleapis.com",
  ])
}

resource "google_project_service" "api" {
  for_each = local.apis

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false
}
