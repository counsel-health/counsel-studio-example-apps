locals {
  apis = toset([
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
  ])
}

resource "google_project_service" "api" {
  for_each = local.apis

  project = var.gcp_project_id
  service = each.value

  disable_on_destroy = false
}
