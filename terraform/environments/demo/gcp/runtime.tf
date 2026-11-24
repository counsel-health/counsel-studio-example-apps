# Both services run as this account. It has no access other than the grant below.
resource "google_service_account" "runtime" {
  project      = var.gcp_project_id
  account_id   = "embedded-demo-runtime"
  display_name = "Embedded demo runtime"

  depends_on = [google_project_service.api]
}

# Doppler owns the secrets, so the grant matches them by the prefix and not one by one.
resource "google_project_iam_member" "runtime_secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.runtime.email}"

  condition {
    title       = "doppler-secrets-only"
    description = "Only the secrets that the Doppler sync writes."
    expression  = "resource.name.startsWith(\"projects/${data.google_project.current.number}/secrets/${var.secret_prefix}\")"
  }
}
