<!-- markdownlint-disable MD033 MD041 -->

<a id="readme-top"></a>

<div align="center">

![Status](https://img.shields.io/badge/Status-Complete-success?style=for-the-badge)
![Step](https://img.shields.io/badge/Step-7%20of%207-blue?style=for-the-badge)
![Cost](https://img.shields.io/badge/Est.%20Cost-<$50%2Fmo-purple?style=for-the-badge)

# 🏗️ storage-rbac

**Deploy an Azure Storage Account with Storage Blob Data Contributor role assignment**

[View Architecture](#-architecture) · [View Artifacts](#-generated-artifacts) · [View Progress](#-workflow-progress)

</div>

---

## 📋 Project Summary

| Property           | Value                            |
| ------------------ | -------------------------------- |
| **Created**        | 2026-03-06                       |
| **Last Updated**   | 2026-03-06 (Step 7 complete)     |
| **AVM Module**     | `storage/storage-account:0.14.0` |
| **Region**         | swedencentral                    |
| **Environment**    | dev                              |
| **Estimated Cost** | ~$0.50/month                     |
| **AVM Coverage**   | 1/1 (Storage Account via AVM)    |

---

## ✅ Workflow Progress

```text
[██████████] 100% Complete
```

| Step | Phase          |                                Status                                 | Artifact                                                           |
| :--: | -------------- | :-------------------------------------------------------------------: | ------------------------------------------------------------------ |
|  1   | Requirements   | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [01-requirements.md](./01-requirements.md)                         |
|  2   | Architecture   | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [02-architecture-assessment.md](./02-architecture-assessment.md)   |
|  3   | Design         | ![Skip](https://img.shields.io/badge/-Skipped-blue?style=flat-square) | —                                                                  |
|  4   | Planning       | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [04-implementation-plan.md](./04-implementation-plan.md)           |
|  5   | Implementation | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [05-implementation-reference.md](./05-implementation-reference.md) |
|  6   | Deployment     | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [06-deployment-summary.md](./06-deployment-summary.md)             |
|  7   | Documentation  | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | [07-documentation-index.md](./07-documentation-index.md)           |

> **Legend**:
> ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) Complete
> | ![WIP](https://img.shields.io/badge/-WIP-yellow?style=flat-square) In Progress
> | ![Pending](https://img.shields.io/badge/-Pending-lightgrey?style=flat-square) Pending
> | ![Skip](https://img.shields.io/badge/-Skipped-blue?style=flat-square) Skipped

---

## 🏛️ Architecture

### Key Resources

| Resource                     | Type                                    | SKU          | Purpose                                |
| ---------------------------- | --------------------------------------- | ------------ | -------------------------------------- |
| st-storage-rbac-dev-{suffix} | Microsoft.Storage/storageAccounts       | Standard_LRS | Blob storage                           |
| Role Assignment              | Microsoft.Authorization/roleAssignments | N/A          | Storage Blob Data Contributor for user |

---

## 📄 Generated Artifacts

<details open>
<summary><strong>📁 Step 1-3: Requirements, Architecture & Design</strong></summary>

| File                                                             | Description                    |                                Status                                 | Created    |
| ---------------------------------------------------------------- | ------------------------------ | :-------------------------------------------------------------------: | ---------- |
| [01-requirements.md](./01-requirements.md)                       | Project requirements with NFRs | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |
| [02-architecture-assessment.md](./02-architecture-assessment.md) | WAF assessment (5 pillars)     | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |

</details>

<details open>
<summary><strong>📁 Step 4: Planning</strong></summary>

| File                                                     | Description               |                                Status                                 | Created    |
| -------------------------------------------------------- | ------------------------- | :-------------------------------------------------------------------: | ---------- |
| [04-implementation-plan.md](./04-implementation-plan.md) | Bicep implementation plan | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |

</details>

<details open>
<summary><strong>📁 Steps 5-6: Implementation & Deployment</strong></summary>

| File                                                               | Description                    |                                Status                                 | Created    |
| ------------------------------------------------------------------ | ------------------------------ | :-------------------------------------------------------------------: | ---------- |
| [05-implementation-reference.md](./05-implementation-reference.md) | Bicep code reference           | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |
| [06-deployment-summary.md](./06-deployment-summary.md)             | Deployment summary (Succeeded) | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |

</details>

<details open>
<summary><strong>📁 Step 7: As-Built Documentation</strong></summary>

| File                                                     | Description                  |                                Status                                 | Created    |
| -------------------------------------------------------- | ---------------------------- | :-------------------------------------------------------------------: | ---------- |
| [07-documentation-index.md](./07-documentation-index.md) | As-built documentation index | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |
| [07-design-document.md](./07-design-document.md)         | As-built architecture design | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |
| [07-operations-runbook.md](./07-operations-runbook.md)   | Operational runbook          | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |
| [07-resource-inventory.md](./07-resource-inventory.md)   | Deployed resource inventory  | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-03-06 |

</details>

---

## 🔗 Related Resources

| Resource                  | Link                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| Storage Account docs      | [Overview](https://learn.microsoft.com/azure/storage/common/storage-account-overview)        |
| Azure RBAC built-in roles | [Built-in roles](https://learn.microsoft.com/azure/role-based-access-control/built-in-roles) |

---

<div align="center">

_Generated by the Agentic InfraOps multi-agent workflow_

[⬆️ Back to top](#readme-top) · [📁 All Projects](../README.md)

</div>
