# 🏗️ Terraform Learning Guide

## 🎯 What You'll Learn

### **Core Concepts:**
1. **Infrastructure as Code (IaC)** - Define infrastructure in files
2. **Declarative syntax** - Describe desired state
3. **State management** - Track what's deployed
4. **Providers** - Connect to cloud platforms
5. **Modules** - Reusable infrastructure components
6. **Variables** - Parameterize your infrastructure

---

## 📖 What is Terraform?

### **Simple Explanation:**

**Without Terraform:**
```
1. Login to Oracle Cloud console
2. Click "Create VM"
3. Fill in 20 form fields
4. Wait 5 minutes
5. Manually configure firewall
6. Manually install Docker
7. Manually set up networking
8. Repeat for each environment (dev, staging, prod)
```

**With Terraform:**
```
1. Write config once: main.tf
2. Run: terraform apply
3. Everything created automatically
4. Reuse for dev, staging, prod
```

---

## 🎓 Level 1: Terraform Basics

### **Install Terraform**

```bash
# On Mac
brew install terraform

# Verify
terraform --version
```

---

### **Your First Terraform File**

Create `terraform/main.tf`:

```hcl
# Configure Oracle Cloud provider
terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  region = var.region
  # Credentials from ~/.oci/config
}

# Variables
variable "region" {
  description = "Oracle Cloud region"
  default     = "uk-london-1"
}

variable "compartment_id" {
  description = "Oracle Cloud compartment ID"
  type        = string
}

# Create a Virtual Cloud Network (VCN)
resource "oci_core_vcn" "job_searcher_vcn" {
  compartment_id = var.compartment_id
  display_name   = "job-searcher-vcn"
  cidr_block     = "10.0.0.0/16"
  dns_label      = "jobsearcher"
}

# Create a subnet
resource "oci_core_subnet" "job_searcher_subnet" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.job_searcher_vcn.id
  display_name   = "job-searcher-subnet"
  cidr_block     = "10.0.1.0/24"
  dns_label      = "app"
}

# Create Internet Gateway
resource "oci_core_internet_gateway" "job_searcher_igw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.job_searcher_vcn.id
  display_name   = "job-searcher-igw"
  enabled        = true
}

# Create route table
resource "oci_core_route_table" "job_searcher_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.job_searcher_vcn.id
  display_name   = "job-searcher-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.job_searcher_igw.id
  }
}

# Security list (firewall rules)
resource "oci_core_security_list" "job_searcher_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.job_searcher_vcn.id
  display_name   = "job-searcher-security-list"

  # Allow SSH
  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Allow HTTP
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Allow HTTPS
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Allow all outbound
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

# Create VM instance
resource "oci_core_instance" "job_searcher_vm" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "job-searcher-vm"
  shape               = "VM.Standard.E2.1.Micro" # Free tier

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu.images[0].id
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.job_searcher_subnet.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = file("~/.ssh/id_rsa.pub")
    user_data = base64encode(templatefile("${path.module}/cloud-init.yaml", {
      docker_compose = file("${path.module}/../docker-compose.yml")
      env_file       = file("${path.module}/../.env")
    }))
  }
}

# Data sources
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.E2.1.Micro"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# Outputs
output "vm_public_ip" {
  description = "Public IP of the VM"
  value       = oci_core_instance.job_searcher_vm.public_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh ubuntu@${oci_core_instance.job_searcher_vm.public_ip}"
}
```

---

### **Key Terraform Concepts Explained:**

#### **1. Resources**
```hcl
resource "oci_core_instance" "job_searcher_vm" {
  # Configuration
}
```
- **resource** = Thing to create (VM, network, database)
- **"oci_core_instance"** = Type (Oracle Cloud VM)
- **"job_searcher_vm"** = Name you give it

#### **2. Variables**
```hcl
variable "region" {
  default = "uk-london-1"
}
```
- Make your config reusable
- Change values without editing code

#### **3. Data Sources**
```hcl
data "oci_core_images" "ubuntu" {
  # Query existing resources
}
```
- Fetch information from cloud provider
- Use existing resources

#### **4. Outputs**
```hcl
output "vm_public_ip" {
  value = oci_core_instance.job_searcher_vm.public_ip
}
```
- Display useful information after deployment
- Use in other Terraform configs

---

## 🚀 Level 2: Deploy with Terraform

### **Step 1: Set Up Oracle Cloud Credentials**

```bash
# Create Oracle Cloud config directory
mkdir -p ~/.oci

# Create config file
cat > ~/.oci/config << EOF
[DEFAULT]
user=ocid1.user.oc1..your-user-ocid
fingerprint=your-fingerprint
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..your-tenancy-ocid
region=uk-london-1
EOF

# Generate API key
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem

# Get public key (upload to Oracle Cloud console)
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
cat ~/.oci/oci_api_key_public.pem
```

---

### **Step 2: Create terraform.tfvars**

```hcl
# terraform/terraform.tfvars
region         = "uk-london-1"
compartment_id = "ocid1.compartment.oc1..your-compartment-id"
```

---

### **Step 3: Initialize Terraform**

```bash
cd terraform

# Download provider plugins
terraform init
```

**What happens:**
- Downloads Oracle Cloud provider
- Creates `.terraform` directory
- Prepares for deployment

---

### **Step 4: Plan (Preview Changes)**

```bash
terraform plan
```

**Output:**
```
Plan: 7 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + vm_public_ip = (known after apply)
  + ssh_command  = (known after apply)
```

**This shows what Terraform will create (without actually creating it)**

---

### **Step 5: Apply (Create Infrastructure)**

```bash
terraform apply
```

**Terraform will:**
1. Create VCN (network)
2. Create subnet
3. Create internet gateway
4. Create security list (firewall)
5. Create VM instance
6. Install Docker automatically
7. Deploy your app

**Time: ~5 minutes**

**Output:**
```
Apply complete! Resources: 7 added, 0 changed, 0 destroyed.

Outputs:
vm_public_ip = "132.145.xxx.xxx"
ssh_command = "ssh ubuntu@132.145.xxx.xxx"
```

---

### **Step 6: Access Your App**

```bash
# SSH into VM
ssh ubuntu@132.145.xxx.xxx

# Check Docker containers
docker ps

# Your app is running!
```

**Visit:** `http://132.145.xxx.xxx:3000`

---

## 🔄 Level 3: Terraform Workflow

### **Common Commands:**

```bash
# Initialize (first time only)
terraform init

# Format code
terraform fmt

# Validate syntax
terraform validate

# Preview changes
terraform plan

# Apply changes
terraform apply

# Destroy everything
terraform destroy

# Show current state
terraform show

# List resources
terraform state list
```

---

## 📦 Level 4: Terraform Modules

### **What are Modules?**

**Problem:** Repeating the same config for dev, staging, prod

**Solution:** Create reusable modules

### **Example Structure:**

```
terraform/
├── modules/
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── network/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
├── environments/
│   ├── dev/
│   │   └── main.tf
│   ├── staging/
│   │   └── main.tf
│   └── prod/
│       └── main.tf
```

### **Using Modules:**

```hcl
# environments/prod/main.tf
module "network" {
  source = "../../modules/network"
  
  environment = "prod"
  cidr_block  = "10.0.0.0/16"
}

module "compute" {
  source = "../../modules/compute"
  
  environment = "prod"
  subnet_id   = module.network.subnet_id
  vm_count    = 3  # Scale to 3 VMs
}
```

---

## 🌍 Level 5: Multi-Cloud with Terraform

### **Terraform Works with ALL Cloud Providers:**

```hcl
# AWS
provider "aws" {
  region = "us-east-1"
}

# Google Cloud
provider "google" {
  project = "my-project"
  region  = "us-central1"
}

# Azure
provider "azurerm" {
  features {}
}

# Oracle Cloud
provider "oci" {
  region = "uk-london-1"
}
```

**Same Terraform syntax, different providers!**

---

## 🎯 Terraform vs Other Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Terraform** | Create infrastructure | Always (VMs, networks, databases) |
| **Docker** | Package applications | Always (containerize your app) |
| **Docker Compose** | Orchestrate containers | Single server deployments |
| **Kubernetes** | Orchestrate containers | Multi-server, auto-scaling |
| **Ansible** | Configure servers | Install software, manage configs |

**They work together!**

```
Terraform → Creates VMs
   ↓
Ansible → Installs Docker
   ↓
Docker Compose → Runs your app
```

---

## 🔐 Terraform Best Practices

### **1. Use Remote State**

```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "job-searcher/terraform.tfstate"
    region = "us-east-1"
  }
}
```

**Why?** Team collaboration, state locking

---

### **2. Use Variables**

```hcl
# Don't hardcode
resource "oci_core_instance" "vm" {
  display_name = "job-searcher-vm"  # ❌ Bad
}

# Use variables
resource "oci_core_instance" "vm" {
  display_name = "${var.environment}-job-searcher-vm"  # ✅ Good
}
```

---

### **3. Use Modules**

```hcl
# Don't repeat code
# ❌ Bad: Copy-paste for dev, staging, prod

# Use modules
# ✅ Good: Reuse module with different variables
module "app" {
  source      = "./modules/app"
  environment = "prod"
}
```

---

### **4. Version Control**

```bash
# .gitignore
.terraform/
*.tfstate
*.tfstate.backup
terraform.tfvars  # Contains secrets
```

---

## 💡 Real-World Example: Your Job Searcher

### **Complete Terraform Setup:**

```
job_searcher/
├── terraform/
│   ├── main.tf              # Main config
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Outputs
│   ├── terraform.tfvars     # Variable values (gitignored)
│   ├── cloud-init.yaml      # VM initialization script
│   └── modules/
│       ├── network/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       └── compute/
│           ├── main.tf
│           ├── variables.tf
│           └── outputs.tf
```

---

## 🚀 Terraform + Docker + CI/CD

### **Complete Automation:**

```yaml
# .github/workflows/deploy.yml
name: Deploy Infrastructure

on:
  push:
    branches: [ main ]

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform
      
      - name: Terraform Plan
        run: terraform plan
        working-directory: ./terraform
      
      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: ./terraform
```

**Now infrastructure is automated too!**

---

## 📊 Learning Path Summary

### **Your Complete Infrastructure Stack:**

```
Level 1: Docker (Containerization)
   ↓
Level 2: Docker Compose (Local orchestration)
   ↓
Level 3: Terraform (Infrastructure as Code)  ← NEW!
   ↓
Level 4: Cloud Deployment (Oracle Cloud)
   ↓
Level 5: CI/CD (GitHub Actions)
   ↓
Level 6: Kubernetes (Optional, advanced)
```

---

## 🎓 Skills Gained

### **After Learning Terraform:**

✅ **Infrastructure as Code** - Industry standard
✅ **Multi-cloud** - Works with AWS, GCP, Azure, Oracle
✅ **Version control infrastructure** - Git for servers
✅ **Reproducible deployments** - Identical every time
✅ **Team collaboration** - Share infrastructure code
✅ **Disaster recovery** - Rebuild with one command

**These are DevOps engineer skills!**

---

## 📚 Next Steps

1. **Install Terraform**
   ```bash
   brew install terraform
   ```

2. **Read Terraform docs**
   - https://developer.hashicorp.com/terraform/tutorials

3. **Practice with your project**
   - Start with simple VM creation
   - Add networking
   - Add automation

4. **Combine with Docker**
   - Terraform creates infrastructure
   - Docker runs your app

---

## 🎯 Recommendation

**Add Terraform to your learning path:**

**Week 1:** Docker basics
**Week 2:** Docker Compose
**Week 3:** Terraform basics ← NEW!
**Week 4:** Deploy with Terraform
**Week 5:** CI/CD automation

**Total time: ~12-15 hours**
**Result: Full-stack infrastructure skills**

---

## 💡 Key Principle (Ray Dalio Style)

### **Principle: Infrastructure as Code**

**Traditional way:**
- Manual clicks in console
- Undocumented changes
- Hard to reproduce
- Error-prone

**Terraform way:**
- Everything in code
- Version controlled
- Reproducible
- Automated

**"If it's not in code, it doesn't exist"**

This is how modern companies (Google, Netflix, Airbnb) manage infrastructure.
