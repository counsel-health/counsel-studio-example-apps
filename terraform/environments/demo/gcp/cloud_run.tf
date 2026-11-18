resource "google_cloud_run_v2_service" "service" {
  for_each = var.services

  project  = var.gcp_project_id
  name     = each.key
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  invoker_iam_disabled = each.value.invoker_iam_disabled

  template {
    service_account                  = local.runtime_service_account
    execution_environment            = "EXECUTION_ENVIRONMENT_GEN2"
    timeout                          = "${each.value.timeout_seconds}s"
    max_instance_request_concurrency = each.value.concurrency

    scaling {
      min_instance_count = each.value.min_instances
      max_instance_count = each.value.max_instances
    }

    containers {
      name  = "${each.key}-1"
      image = var.bootstrap_image

      ports {
        name           = "http1"
        container_port = each.value.port
      }

      resources {
        limits = {
          cpu    = each.value.cpu
          memory = each.value.memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      dynamic "env" {
        for_each = each.value.secret_env

        content {
          name = env.value

          value_source {
            secret_key_ref {
              secret  = "${var.secret_prefix}${env.value}"
              version = "latest"
            }
          }
        }
      }
    }
  }

  # CD owns the image, and the deploy action stamps its own labels and client fields.
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      labels,
      template[0].labels,
      template[0].containers[0].image,
    ]
  }

  depends_on = [google_project_service.api]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  for_each = google_cloud_run_v2_service.service

  project  = var.gcp_project_id
  location = each.value.location
  name     = each.value.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "domain" {
  for_each = var.domain_mappings

  project  = var.gcp_project_id
  name     = each.key
  location = var.gcp_region

  metadata {
    namespace = var.gcp_project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.service[each.value].name
  }

  # A replace drops the managed certificate and takes the domain offline.
  # One live mapping has no certificate mode, and a change to it forces a replace.
  lifecycle {
    prevent_destroy = true
    ignore_changes  = [spec[0].certificate_mode]
  }
}
