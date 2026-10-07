# Own local resolver checks only: no target traffic or package execution.
$ErrorActionPreference = 'Stop'
$taskScript = Join-Path $PSScriptRoot 'inspect-environment.ps1'
$taskTests = 0
function Assert-Task($Condition, $Message) { if (-not $Condition) { throw $Message } }
$taskDefault = & $taskScript | ConvertFrom-Json
Assert-Task ($taskDefault.commands.Count -eq 13) 'Default aperture changed'; $taskTests++
Assert-Task ($taskDefault.dataClass -eq 'EXTERNAL_MINIMIZED' -and $taskDefault.commands[0].PSObject.Properties.Name -notcontains 'resolvedPaths') 'Default exposed paths'; $taskTests++
function Halveth-Inspector-Canary { throw 'Discovered function was executed' }
$taskKnown = & $taskScript -Commands @('Halveth-Inspector-Canary','HalvethMissingCommand987654') | ConvertFrom-Json
Assert-Task ($taskKnown.commands[0].state -eq 'RESOLVABLE_IN_CURRENT_SESSION' -and $taskKnown.commands[0].functionality -eq 'NOT_CHECKED') 'Function was not discovered safely'; $taskTests++
Assert-Task ($taskKnown.commands[1].state -eq 'NOT_RESOLVABLE_IN_CURRENT_SESSION' -and $taskKnown.commands[1].installedOutsideCurrentResolver -eq 'UNKNOWN') 'Missing resolver was converted to an installation claim'; $taskTests++
$taskPrivate = & $taskScript -Commands @('Halveth-Inspector-Canary') -IncludePaths | ConvertFrom-Json
Assert-Task ($taskPrivate.dataClass -eq 'RESTRICTED_RAW') 'Private output is unlabelled'; $taskTests++
foreach ($taskInvalid in @(@('git*'),@('git','GIT'),@('git,powershell.exe'),@('../git'))) {
    $taskRejected = $false
    try { $null = & $taskScript -Commands $taskInvalid } catch { $taskRejected = $true }
    Assert-Task $taskRejected 'Invalid exact input was accepted'; $taskTests++
}
[pscustomobject]@{state='LOCAL_RESOLVER_TESTS_PASSED';tests=$taskTests;targetRequests=0;packageExecutions=0;claimCeiling='DECLARED_SCRIPT_BEHAVIOR_ONLY'} | ConvertTo-Json
