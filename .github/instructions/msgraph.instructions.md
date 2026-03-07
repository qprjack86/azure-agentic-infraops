---
applyTo: "**/04-*.md, **/05*-Planner.md, **/06*-CodeGen.md, **/08-As-Built.md, **/09-Diagnose.md, **/10-Challenger.md"
description: "MANDATORY Microsoft Graph and Entra ID discovery requirements for identity resources"
---

# Microsoft Graph & Identity Instructions

**CRITICAL**: Entra ID Object IDs, Graph API endpoints, and permission scopes MUST be discovered via the `msgraph` skill, NOT assumed from general knowledge.
**GATE**: This is a mandatory gate. If a workload requires role assignments, App Registrations, or user/group lookups, you MUST query the skill.
Do NOT generate identity code with placeholder values.

## Why This Matters

Assumed identity variables cause immediate deployment failures and security vulnerabilities. Example:

- **Assumed**: Using a dummy GUID (`00000000-0000-0000-0000-000000000000`) for a Key Vault access policy.
- **Actual**: Azure Resource Manager (ARM) attempts to resolve the principal.
- **Result**: Deployment fails with a `PrincipalNotFound` error.

**Graph API permissions are easily hallucinated.** Example:

- **Assumed**: Requesting `ActiveDirectory.ReadWrite.All` for an App Registration.
- **Actual**: That scope does not exist; the correct scope is `Directory.ReadWrite.All`.
- **Result**: App deployment fails or creates a broken security principal.

## Discovery Is Delegated to the Skill

The `msgraph` skill handles all procedural Entra ID and Graph API work:

1. Searches the local index for exact Microsoft Graph API endpoints and schemas
2. Looks up exact Microsoft Graph permission scopes (Delegated vs. Application)
3. Executes live queries to retrieve real `objectId` values for users, groups, and service principals

**This instruction file defines the output format standards and decision framework that the architecture and code generation agents MUST apply to the skill's findings.**

## Required Documentation

When generating design or as-built documentation that includes identity, the file MUST include:

### Discovery Source Section (MANDATORY)

```markdown
## Identity Discovery Source

> [!IMPORTANT]
> Entra ID objects and Microsoft Graph permissions discovered via the msgraph skill.

| Query Type            | Result                 | Timestamp  |
| --------------------- | ---------------------- | ---------- |
| Target Object IDs     | {X} principals found   | {ISO-8601} |
| Missing Principals    | {X} resources to build | {ISO-8601} |
| API Permission Scopes | {X} scopes validated   | {ISO-8601} |

**Discovery Method**: `msgraph` skill local index and tenant execution
**Tenant**: {tenant-id}
```

## Fail-safe: If Discovery Fails

If the msgraph skill returns an error or cannot find the principal:

1. STOP — Do NOT proceed to generate IaC templates with dummy data.
2. Document the failure in the design or plan file.
3. Add warning: "⛔ GATE BLOCKED: Deployment CANNOT proceed due to missing Entra ID principal {principal-name}".
4. Do NOT generate assumed GUIDs as a fallback.

## Identity Resolution Decision Tree

```text
Identity Resource Required (e.g., User, Group, Service Principal)
    ↓
Query `msgraph` skill for Object ID
    ↓
Does the resource exist in the tenant?
    ↓
├─ NO → Is it a resource this deployment is supposed to create?
│       ↓
│   ├─ YES → Update implementation plan to provision it
│   └─ NO → Flag as DEPLOYMENT BLOCKER
│           Add to "## Deployment Blockers" section
│           Status: "⚠️ PREREQUISITE MISSING: Principal not found in Entra ID"
└─ YES → Extract real `objectId`
         ↓
         Inject into IaC plan or template parameters
```

````markdown
## Security & Permission Handling (Shift-Left Enforcement)

**CRITICAL** Discovered API capabilities MUST influence the architecture plan and generated code.

| Identity Requirement | Impact                            | Required Action                                          |
| -------------------- | --------------------------------- | -------------------------------------------------------- |
| Role Assignments     | Fails if principalId is invalid   | Query skill for exact objectId; parameterise in code     |
| App Permissions      | Fails if scope is hallucinated    | Query skill for exact scope name (e.g., User.Read.All)   |
| High Privilege       | Security risk if over-provisioned | Validate against Graph docs; recommend least privilege   |
| Authorisation        | Blocks current deployment         | Use skill to check if required principal actually exists |

## Misleading Permissions - Verify Definitions

> [!WARNING]
> NEVER trust permission display names alone. "Read all user profiles" may require vastly different scopes depending on the endpoint.

| Assumed Requirement | Likely Actual Requirement          | Verify By Checking                             |
| ------------------- | ---------------------------------- | ---------------------------------------------- |
| "Read Users"        | User.Read.All                      | msgraph index for /users GET endpoint          |
| "Manage groups"     | Group.ReadWrite.All                | msgraph index for /groups POST/PATCH endpoints |
| "Admin access"      | RoleManagement.ReadWrite.Directory | msgraph index for directory roles              |

## Validation Checklist

Before completing an architecture plan or generating IaC templates, verify:

[ ] msgraph skill was queried for all required Entra ID resources

[ ] Identity Discovery Source section is populated with timestamps

[ ] No placeholder GUIDs (e.g., 00000000-0000-0000-0000-000000000000) exist in generated templates

[ ] No // TODO: Insert Object ID here comments exist in the code

[ ] API permissions map exactly to documented Microsoft Graph scopes

[ ] High-privilege permissions (e.g., Directory.ReadWrite.All) have been challenged and minimised

## Anti-Patterns (DO NOT DO)

❌ Assumption-based Identity (Placeholder GUIDs):

```bicep
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, 'Contributor')
  properties: {
    roleDefinitionId: contributorRole
    principalId: '00000000-0000-0000-0000-000000000000' // Avoid placeholder GUIDs
  }
}
```
````

✅ Discovery-based Identity (Real Parameterised IDs):

```bicep
@description('Object ID of the required Entra ID group, retrieved via msgraph skill')
param targetGroupObjectId string = 'a1b2c3d4-e5f6-7890-1234-56789abcdef0'

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, 'Contributor')
  properties: {
    roleDefinitionId: contributorRole
    principalId: targetGroupObjectId
  }
}
```

## Downstream Enforcement

Discovered identity constraints do not stop at planning — they MUST flow through to the code generation and review subagents:

1. Bicep/Terraform Code Generators (Phase 1.5) read the architecture plan and MUST use the explicitly discovered objectId values provided by the msgraph skill.

2. Challenger Subagent reviews the generated code and flags any hardcoded placeholder GUIDs or excessively broad Microsoft Graph permission scopes as strict violations.
