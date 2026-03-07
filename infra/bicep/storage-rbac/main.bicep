targetScope = 'resourceGroup'

// ──────────────────────────────────────────────
// Parameters
// ──────────────────────────────────────────────

@description('Project identifier for naming')
param projectName string = 'storage-rbac'

@description('Environment (dev/staging/prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Primary Azure region')
param location string = resourceGroup().location

@description('Owner for tagging')
param owner string = 'Jack Stalley'

@description('Entra ID Object ID of the user for RBAC role assignment')
param principalId string

@description('Principal type for role assignment')
@allowed(['User', 'Group', 'ServicePrincipal'])
param principalType string = 'User'

// ──────────────────────────────────────────────
// Variables
// ──────────────────────────────────────────────

var uniqueSuffix = uniqueString(resourceGroup().id)
var storageAccountName = 'st${take(replace(projectName, '-', ''), 10)}${environment}${take(uniqueSuffix, 4)}'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

var requiredTags = {
  Environment: environment
  ManagedBy: 'Bicep'
  Project: projectName
  Owner: owner
}

// ──────────────────────────────────────────────
// Storage Account (AVM)
// ──────────────────────────────────────────────

module storageAccount 'br/public:avm/res/storage/storage-account:0.14.0' = {
  name: 'deploy-st-${projectName}'
  params: {
    name: storageAccountName
    location: location
    kind: 'StorageV2'
    skuName: 'Standard_LRS'
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    tags: requiredTags
  }
}

// ──────────────────────────────────────────────
// Role Assignment — Storage Blob Data Contributor
// ──────────────────────────────────────────────

resource storageRef 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageRef.id, principalId, storageBlobDataContributorRoleId)
  scope: storageRef
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      storageBlobDataContributorRoleId
    )
    principalId: principalId
    principalType: principalType
  }
  dependsOn: [storageAccount]
}

// ──────────────────────────────────────────────
// Outputs
// ──────────────────────────────────────────────

output storageAccountName string = storageAccount.outputs.name
output storageAccountId string = storageAccount.outputs.resourceId
output roleAssignmentId string = roleAssignment.id
output blobEndpoint string = storageAccount.outputs.primaryBlobEndpoint
