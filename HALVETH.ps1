[CmdletBinding()]
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
$taskNode = if ($env:HALVETH_NODE) { $env:HALVETH_NODE } else { 'node' }
& $taskNode (Join-Path $PSScriptRoot 'scripts/halveth-entry.mjs') @Arguments
exit $LASTEXITCODE
