output "service_urls" {
  description = "Cloud Run URL of each service"
  value       = { for name, service in google_cloud_run_v2_service.service : name => service.uri }
}

output "registry_url" {
  description = "Docker repository URL that CD pushes images to"
  value       = local.registry_url
}
