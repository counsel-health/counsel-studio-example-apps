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

1. Open a PR. `ci-terraform.yml` checks the format, validates the config, and runs a plan.
2. Open the run link in the `terraform-plan` job and read the plan in Terraform Cloud.
3. Merge the PR. `cd-terraform.yml` applies the change on `main`.

## Run Terraform locally

Use the Terraform version in `.terraform-version`.

```bash
terraform login
cd terraform/environments/demo/gcp
terraform init
terraform plan -var "gcp_project_id=<project id>"
```

Do not run `terraform apply` locally. The CD workflow is the only apply path.

## Setup

- The workspace must use the CLI-driven workflow with remote execution. It must hold GCP credentials for the project.
- The Terraform version of the workspace must be the version in `.terraform-version`.
- The `TF_PLAN_TOKEN` repository secret must hold a Terraform Cloud token that can plan only.
- The `terraform-apply` GitHub environment must hold the `TF_API_TOKEN` secret, a token that can apply. Limit the environment to `main`.
- The `PROJECT_ID` repository variable supplies the `gcp_project_id` variable.

## Public logs

This repository and its Actions logs are public. A plan prints live env values and account emails. The workflows print only the run link and the summary line. Read the full plan and apply in Terraform Cloud.
