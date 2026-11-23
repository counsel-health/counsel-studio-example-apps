resource "google_artifact_registry_repository" "embedded_demo" {
  project       = var.gcp_project_id
  location      = var.gcp_region
  repository_id = "embedded-demo"
  description   = "Embedded Demo containers"
  format        = "DOCKER"

  cleanup_policy_dry_run = true

  docker_config {
    immutable_tags = false
  }

  depends_on = [google_project_service.api]

  # A replace deletes every image.
  lifecycle {
    prevent_destroy = true
  }
}

resource "google_artifact_registry_repository_iam_member" "deploy_writer" {
  project    = var.gcp_project_id
  location   = google_artifact_registry_repository.embedded_demo.location
  repository = google_artifact_registry_repository.embedded_demo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deploy.email}"
}

# The preview cleanup deletes images, which the writer role does not permit.
resource "google_project_iam_custom_role" "deploy_image_cleanup" {
  project     = var.gcp_project_id
  role_id     = "deployImageCleanup"
  title       = "Deploy: image cleanup"
  description = "Lets the deploy account delete images, with their versions and tags, in a repository."
  permissions = [
    "artifactregistry.packages.delete",
    "artifactregistry.repositories.deleteArtifacts",
    "artifactregistry.tags.delete",
    "artifactregistry.versions.delete",
  ]

  depends_on = [google_project_service.api]
}

resource "google_artifact_registry_repository_iam_member" "deploy_image_cleanup" {
  project    = var.gcp_project_id
  location   = google_artifact_registry_repository.embedded_demo.location
  repository = google_artifact_registry_repository.embedded_demo.name
  role       = google_project_iam_custom_role.deploy_image_cleanup.id
  member     = "serviceAccount:${google_service_account.deploy.email}"
}
