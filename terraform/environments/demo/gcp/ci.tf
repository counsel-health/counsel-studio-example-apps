# GitHub Actions deploys as this account.
resource "google_service_account" "deploy" {
  project    = var.gcp_project_id
  account_id = "my-service-account"

  depends_on = [google_project_service.api]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "deploy_run_developer" {
  project = var.gcp_project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# The preview deploys make each new service public. The developer role does not permit that.
resource "google_project_iam_custom_role" "deploy_run_public_access" {
  project     = var.gcp_project_id
  role_id     = "deployRunPublicAccess"
  title       = "Deploy: Cloud Run public access"
  description = "Lets the deploy account set the access policy of a Cloud Run service."
  permissions = ["run.services.setIamPolicy"]

  depends_on = [google_project_service.api]
}

resource "google_project_iam_member" "deploy_run_public_access" {
  project = var.gcp_project_id
  role    = google_project_iam_custom_role.deploy_run_public_access.id
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# A deploy must act as the runtime account of the services, and as no other account.
resource "google_service_account_iam_member" "deploy_runtime_user" {
  service_account_id = google_service_account.runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deploy.email}"
}

# Only workflows of this repository can impersonate the deploy account through the pool.
resource "google_service_account_iam_member" "deploy_github_repository" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
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
