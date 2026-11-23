# Grants from before Terraform that the deploy workflows do not use. Delete this file to remove them.
locals {
  deploy_old_project_roles = toset([
    "roles/artifactregistry.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountTokenCreator",
    "roles/iam.serviceAccountUser",
    "roles/iam.workloadIdentityUser",
    "roles/run.admin",
    "roles/secretmanager.secretAccessor",
  ])

  deploy_old_pool_principal = "iam.googleapis.com/projects/${data.google_project.current.number}/locations/global/workloadIdentityPools/github"
  deploy_old_pool_members = {
    old_repository = "principalSet://${local.deploy_old_pool_principal}/attribute.repository/counsel-health/counsel-embedded-example-apps"
    placeholder    = "principal://${local.deploy_old_pool_principal}/subject/SUBJECT_ATTRIBUTE_VALUE"
  }
}

resource "google_project_iam_member" "deploy_old" {
  for_each = local.deploy_old_project_roles

  project = var.gcp_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

resource "google_service_account_iam_member" "deploy_old_pool" {
  for_each = local.deploy_old_pool_members

  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = each.value
}

import {
  for_each = local.deploy_old_project_roles

  to = google_project_iam_member.deploy_old[each.value]
  id = "${var.gcp_project_id} ${each.value} serviceAccount:my-service-account@${var.gcp_project_id}.iam.gserviceaccount.com"
}

import {
  for_each = local.deploy_old_pool_members

  to = google_service_account_iam_member.deploy_old_pool[each.key]
  id = "projects/${var.gcp_project_id}/serviceAccounts/my-service-account@${var.gcp_project_id}.iam.gserviceaccount.com roles/iam.workloadIdentityUser ${each.value}"
}
