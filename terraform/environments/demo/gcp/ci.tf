locals {
  deploy_project_roles = toset([
    "roles/artifactregistry.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountTokenCreator",
    "roles/iam.serviceAccountUser",
    "roles/iam.workloadIdentityUser",
    "roles/run.admin",
    "roles/secretmanager.secretAccessor",
  ])
}

# GitHub Actions deploys as this account.
resource "google_service_account" "deploy" {
  project    = var.gcp_project_id
  account_id = "my-service-account"

  depends_on = [google_project_service.api]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "deploy" {
  for_each = local.deploy_project_roles

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# A deleted pool is soft-deleted for 30 days and its ID cannot be reused. Leave the IDs alone.
resource "google_iam_workload_identity_pool" "github" {
  project                   = var.gcp_project_id
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions Pool"

  depends_on = [google_project_service.api]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.gcp_project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "my-repo"
  display_name                       = "Github Actions Provider"

  attribute_condition = "assertion.repository_owner == 'counsel-health'"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
  }

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}
