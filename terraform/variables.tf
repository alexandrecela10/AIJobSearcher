# Terraform Variables for JobSearchingRobot

variable "region" {
  description = "Oracle Cloud region"
  type        = string
  default     = "uk-london-1"
}

variable "compartment_id" {
  description = "Oracle Cloud compartment OCID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "job-searcher"
}

variable "instance_shape" {
  description = "VM shape (free tier: VM.Standard.E2.1.Micro)"
  type        = string
  default     = "VM.Standard.E2.1.Micro"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  default     = ""
}
