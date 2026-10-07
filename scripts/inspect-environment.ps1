# HALVETH: bind the actual resolver state before choosing a tool or action.
# Scope: local command discovery only. This script installs and runs no packages,
# contacts no target, accepts no terms, and grants no external test authority.
# Prerequisite: PowerShell 5.1 or later; availability is not functionality.
[CmdletBinding()]
param(
    [string[]]$Commands = @('git','bash','node','python','py','curl.exe','openssl','dig','nslookup.exe','timeout','winget','pwsh','powershell.exe'),
    [switch]$IncludePaths
)
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion -lt [Version]'5.1') { throw 'PowerShell 5.1 or later is required.' }
if ($Commands.Count -lt 1 -or $Commands.Count -gt 64) { throw 'Supply one through 64 command names.' }
$taskSeen = @{}
foreach ($taskCommand in $Commands) {
    if ($taskCommand -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$' -or $taskSeen.ContainsKey($taskCommand)) { throw 'Exact unique command names are required.' }
    $taskSeen[$taskCommand] = $true
}
$taskRecords = foreach ($taskCommand in $Commands) {
    $taskResolved = Get-Command -Name $taskCommand -ListImported -ErrorAction SilentlyContinue
    $taskRow = [ordered]@{
        name = $taskCommand
        state = $(if ($taskResolved) { 'RESOLVABLE_IN_CURRENT_SESSION' } else { 'NOT_RESOLVABLE_IN_CURRENT_SESSION' })
        commandTypes = @($taskResolved | ForEach-Object { $_.CommandType.ToString() })
        functionality = 'NOT_CHECKED'
        installedOutsideCurrentResolver = 'UNKNOWN'
        licenseAndAccountCapability = 'UNKNOWN'
    }
    if ($IncludePaths) { $taskRow['resolvedPaths'] = @($taskResolved | ForEach-Object { $_.Source }) }
    [pscustomobject]$taskRow
}
[pscustomobject][ordered]@{
    schema = 'halveth.environment-resolver-snapshot.v1'
    recordedAt = [DateTime]::UtcNow.ToString('o')
    observationScope = 'CURRENT_POWERSHELL_COMMAND_RESOLVER_ONLY'
    shell = [ordered]@{ name='PowerShell'; version=$PSVersionTable.PSVersion.ToString(); edition=$PSVersionTable.PSEdition }
    operatingSystemFamily = [Environment]::OSVersion.Platform.ToString()
    dataClass = $(if ($IncludePaths) { 'RESTRICTED_RAW' } else { 'EXTERNAL_MINIMIZED' })
    commands = @($taskRecords)
    packageInstallations = 0
    sourceAgreementAcceptances = 0
    configurationChanges = 0
    networkRequests = 0
    selectedBrowser = 'NOT_SELECTED_BY_THIS_SCRIPT'
    targetAuthorization = 'NOT_EVALUATED'
    originalProgramPolicy = 'NOT_EVALUATED'
    nextStep = 'Choose the smallest required capability; separately verify executable behavior, account, edition and action scope.'
} | ConvertTo-Json -Depth 8
