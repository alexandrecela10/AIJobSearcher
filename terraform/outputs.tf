# Terraform Outputs

output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = oci_core_instance.app.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh ubuntu@${oci_core_instance.app.public_ip}"
}

output "app_url" {
  description = "URL to access the application"
  value       = "http://${oci_core_instance.app.public_ip}:3000"
}

output "vm_id" {
  description = "OCID of the VM instance"
  value       = oci_core_instance.app.id
}

output "vcn_id" {
  description = "OCID of the VCN"
  value       = oci_core_vcn.main.id
}
