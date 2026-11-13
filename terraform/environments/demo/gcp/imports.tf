# Every resource in this root existed before Terraform. Delete this file after the first apply.

locals {
  import_project        = "projects/${var.gcp_project_id}"
  import_location       = "${local.import_project}/locations/${var.gcp_region}"
  import_deploy_account = "my-service-account@${var.gcp_project_id}.iam.gserviceaccount.com"
  import_doppler_email  = "doppler-gsm-sync@${var.gcp_project_id}.iam.gserviceaccount.com"
}

import {
  for_each = local.apis

  to = google_project_service.api[each.value]
  id = "${var.gcp_project_id}/${each.value}"
}

import {
  to = google_artifact_registry_repository.embedded_demo
  id = "${local.import_location}/repositories/embedded-demo"
}

import {
  to = google_artifact_registry_repository_iam_member.deploy_writer
  id = "${local.import_location}/repositories/embedded-demo roles/artifactregistry.writer serviceAccount:${local.import_deploy_account}"
}

import {
  for_each = var.services

  to = google_cloud_run_v2_service.service[each.key]
  id = "${local.import_location}/services/${each.key}"
}

import {
  for_each = var.services

  to = google_cloud_run_v2_service_iam_member.public_invoker[each.key]
  id = "${local.import_location}/services/${each.key} roles/run.invoker allUsers"
}

import {
  for_each = var.domain_mappings

  to = google_cloud_run_domain_mapping.domain[each.key]
  id = "locations/${var.gcp_region}/namespaces/${var.gcp_project_id}/domainmappings/${each.key}"
}

import {
  to = google_service_account.deploy
  id = "${local.import_project}/serviceAccounts/${local.import_deploy_account}"
}

import {
  for_each = local.deploy_project_roles

  to = google_project_iam_member.deploy[each.value]
  id = "${var.gcp_project_id} ${each.value} serviceAccount:${local.import_deploy_account}"
}

import {
  to = google_iam_workload_identity_pool.github
  id = "${local.import_project}/locations/global/workloadIdentityPools/github"
}

import {
  to = google_iam_workload_identity_pool_provider.github
  id = "${local.import_project}/locations/global/workloadIdentityPools/github/providers/my-repo"
}

import {
  to = google_service_account.doppler_sync
  id = "${local.import_project}/serviceAccounts/${local.import_doppler_email}"
}

import {
  to = google_project_iam_member.doppler_sync_secret_admin
  id = "${var.gcp_project_id} roles/secretmanager.admin serviceAccount:${local.import_doppler_email}"
}
