# Doppler writes the app secrets into Secret Manager as this account. Doppler owns the secrets.
resource "google_service_account" "doppler_sync" {
  project      = var.gcp_project_id
  account_id   = "doppler-gsm-sync"
  display_name = "doppler-gsm-sync"
  description  = "doppler-gsm-sync"

  depends_on = [google_project_service.api]

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_project_iam_member" "doppler_sync_secret_admin" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.doppler_sync.email}"
}
