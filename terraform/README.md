# Terraform

Terraform manages the GCP infra for the demo apps. Terraform Cloud holds the state and runs each plan and apply.

| Root | Terraform Cloud workspace |
| --- | --- |
| `environments/demo/gcp` | `counsel-studio-example-apps-demo-gcp` |

## What Terraform owns

- The 2 Cloud Run services, their public access, and their custom domains.
- The `embedded-demo` Artifact Registry repository.
- The GitHub Actions deploy account, its roles, and the Workload Identity pool.
- The Doppler sync account.

Terraform does not own these items:

- The container image of each service. The CD workflows set the image, and Terraform ignores image changes.
- The `doppler-gsm-sync*` secrets. Doppler writes them.
- The PR preview services. `pr-preview.yml` creates and deletes them.

## Change the infra

Edit the `services` variable in `environments/demo/gcp/variables.tf` to change CPU, memory, instance limits, concurrency, or secrets.

1. Open a PR. `ci-terraform.yml` checks the format and validates the config.
2. Terraform Cloud runs a speculative plan on the PR. Open the Terraform Cloud check on the PR and read the plan.
3. Merge the PR. Terraform Cloud runs the apply on `main`.

## Run Terraform locally

Use the Terraform version in `.terraform-version`.

```bash
terraform login
cd terraform/environments/demo/gcp
terraform init
terraform plan
```

A local plan is speculative. The workspace does not accept a local `terraform apply`.

## Workspace setup

- The workspace uses the version control workflow, connected to this repository and the `main` branch.
- The working directory is `terraform/environments/demo/gcp`.
- The Terraform version of the workspace must be the version in `.terraform-version`.
- The workspace must hold GCP credentials for the project.
- The workspace must hold the Terraform variable `gcp_project_id`.
- Keep speculative plans for fork PRs off. A fork plan runs fork code with the workspace credentials.

## Public logs

This repository and its Actions logs are public. A plan prints live env values and account emails. No workflow in this repository runs a plan or an apply, and no workflow holds a Terraform Cloud token. Read each plan and apply in Terraform Cloud.
