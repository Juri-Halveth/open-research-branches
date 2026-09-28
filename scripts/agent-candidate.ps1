# SPDX-License-Identifier: MIT
# Local candidate gate for a text proposal supplied by a human or an agent.
# This tool stages one explicitly allowed file in a separate local Git repository.
# It never runs candidate code or proposal-supplied commands and never touches a remote.
param(
    [Parameter(Mandatory = $true)][string]$Policy,
    [Parameter(Mandatory = $true)][string]$Proposal,
    [Parameter(Mandatory = $true)][string]$RunRoot
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-Utf8NoBom {
    return [System.Text.UTF8Encoding]::new($false, $true)
}

function Set-ProcessGitVariable([string]$Name, $Value) {
    if ($null -eq $Value) {
        Remove-Item -LiteralPath ("Env:" + $Name) -ErrorAction SilentlyContinue
    } else {
        [System.Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    }
}

function Read-JsonObject([string]$Path, [int64]$MaximumBytes = 1048576) {
    $item = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($item.PSIsContainer -or $item.Length -gt $MaximumBytes) {
        throw "JSON input is not a file within the $MaximumBytes-byte limit: $Path"
    }
    $raw = [System.IO.File]::ReadAllText($item.FullName, (New-Utf8NoBom))
    $value = ConvertFrom-Json -InputObject $raw -AsHashtable -Depth 30 -ErrorAction Stop
    if ($value -isnot [System.Collections.IDictionary]) {
        throw "Expected a JSON object: $Path"
    }
    return $value
}

function Assert-Keys([System.Collections.IDictionary]$Object, [string[]]$Required, [string[]]$Optional, [string]$Label) {
    foreach ($key in $Required) {
        if (-not $Object.Contains($key)) { throw "$Label misses required key: $key" }
    }
    $known = @($Required) + @($Optional)
    foreach ($key in $Object.Keys) {
        if ($key -cnotin $known) { throw "$Label has unsupported key: $key" }
    }
}

function Assert-RelativePath([string]$RelativePath) {
    if ([string]::IsNullOrWhiteSpace($RelativePath) -or
        $RelativePath -notmatch '^[A-Za-z0-9._/-]+$' -or
        $RelativePath.StartsWith('/') -or
        $RelativePath.EndsWith('/') -or
        $RelativePath.Contains('//')) {
        throw "Unsafe relative path: $RelativePath"
    }
    foreach ($part in $RelativePath.Split('/')) {
        if ($part -eq '.' -or $part -eq '..' -or $part -eq '') {
            throw "Unsafe relative path component: $RelativePath"
        }
    }
}

function Assert-NoReparseAncestors([string]$AbsolutePath) {
    $cursor = [System.IO.Path]::GetFullPath($AbsolutePath)
    while ($null -ne $cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force
            if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
                throw "Reparse point in path ancestry: $cursor"
            }
        }
        $parent = [System.IO.Path]::GetDirectoryName($cursor.TrimEnd([System.IO.Path]::DirectorySeparatorChar))
        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $cursor) { break }
        $cursor = $parent
    }
}

function Resolve-WorkspacePath([string]$PolicyFile, [string]$WorkspaceRoot) {
    if ([System.IO.Path]::IsPathRooted($WorkspaceRoot)) {
        $candidate = [System.IO.Path]::GetFullPath($WorkspaceRoot)
    } else {
        $candidate = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $PolicyFile) $WorkspaceRoot))
    }
    $item = Get-Item -LiteralPath $candidate -ErrorAction Stop
    if (-not $item.PSIsContainer -or ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
        throw "Workspace root must be a real directory: $candidate"
    }
    Assert-NoReparseAncestors $candidate
    return $candidate
}

function Assert-WithinWorkspace([string]$Root, [string]$RelativePath) {
    Assert-RelativePath $RelativePath
    $candidate = [System.IO.Path]::GetFullPath((Join-Path $Root ($RelativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))))
    $prefix = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $comparison = if ($IsWindows) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
    if (-not $candidate.StartsWith($prefix, $comparison)) {
        throw "Path escapes workspace: $RelativePath"
    }
    $cursor = $Root
    foreach ($part in $RelativePath.Split('/')) {
        $cursor = Join-Path $cursor $part
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force
            if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
                throw "Reparse point in candidate path: $RelativePath"
            }
        }
    }
    return $candidate
}

function Invoke-Git([string]$Directory, [string[]]$Arguments) {
    $output = & git -C $Directory @Arguments 2>&1
    $code = $LASTEXITCODE
    if ($code -ne 0) {
        throw "Git command failed ($code): git $($Arguments -join ' ') :: $($output -join ' ')"
    }
    return @($output)
}

$runPath = $null
$oldGitConfigGlobal = $env:GIT_CONFIG_GLOBAL
$oldGitConfigSystem = $env:GIT_CONFIG_SYSTEM
$oldGitTemplateDir = $env:GIT_TEMPLATE_DIR
$oldGitConfigCount = $env:GIT_CONFIG_COUNT
$inheritedGitKeys = @(
    'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES',
    'GIT_CONFIG_PARAMETERS', 'GIT_EXEC_PATH', 'GIT_EXTERNAL_DIFF',
    'GIT_DIFF_OPTS', 'GIT_PAGER', 'GIT_TRACE', 'GIT_TRACE2',
    'GIT_TRACE2_EVENT', 'GIT_TRACE2_PERF', 'GIT_TRACE_SETUP',
    'GIT_TRACE_PACKET', 'GIT_TRACE_PERFORMANCE', 'GIT_TRACE_SHALLOW',
    'GIT_TRACE_REFS', 'GIT_TRACE_CURL', 'GIT_SSH', 'GIT_SSH_COMMAND',
    'GIT_ASKPASS'
)
$inheritedGitValues = @{}
foreach ($name in $inheritedGitKeys) {
    $inheritedGitValues[$name] = [System.Environment]::GetEnvironmentVariable($name, 'Process')
}
$receipt = [ordered]@{
    schemaVersion = 1
    startedAt = (Get-Date).ToUniversalTime().ToString('o')
    state = 'REJECTED'
    policyFile = $Policy
    proposalFile = $Proposal
    sandbox = $null
    sourceSha256 = $null
    candidateSha256 = $null
    diffSha256 = $null
    candidateCommit = $null
    checks = @()
    errors = @()
    externalWrite = $false
    sourceWrite = $false
}

try {
    $policyFile = [System.IO.Path]::GetFullPath($Policy)
    $proposalFile = [System.IO.Path]::GetFullPath($Proposal)
    $runRootPath = [System.IO.Path]::GetFullPath($RunRoot)
    $policyData = Read-JsonObject $policyFile
    Assert-Keys $policyData @('schemaVersion','workspaceRoot','allowedPaths','allowedExtensions','allowNewFiles','maxCandidateBytes','requiredChecks') @() 'Policy'
    if ($policyData.schemaVersion -ne 1 -or $policyData.workspaceRoot -isnot [string] -or
        [string]::IsNullOrWhiteSpace($policyData.workspaceRoot)) {
        throw 'Invalid policy schemaVersion or workspaceRoot.'
    }
    $workspace = Resolve-WorkspacePath $policyFile ([string]$policyData.workspaceRoot)
    $pathComparison = if ($IsWindows) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
    $wsPrefix = $workspace.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $runPrefix = $runRootPath.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    if ($runRootPath.Equals($workspace, $pathComparison) -or
        $runRootPath.StartsWith($wsPrefix, $pathComparison) -or
        $workspace.StartsWith($runPrefix, $pathComparison)) {
        throw 'Run root and source workspace must not overlap.'
    }
    Assert-NoReparseAncestors $runRootPath
    [System.IO.Directory]::CreateDirectory($runRootPath) | Out-Null
    $runRootItem = Get-Item -LiteralPath $runRootPath -Force
    if ($runRootItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        throw 'Run root cannot be a reparse point.'
    }
    $runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssfffZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
    $runPath = Join-Path $runRootPath $runId
    [System.IO.Directory]::CreateDirectory($runPath) | Out-Null
    # Keep user/system Git filters, hooks and init templates out of the candidate repo.
    $emptyGitConfig = Join-Path $runPath 'empty-git-config'
    [System.IO.File]::WriteAllText($emptyGitConfig, '', (New-Utf8NoBom))
    $emptyGitTemplate = Join-Path $runPath 'empty-git-template'
    [System.IO.Directory]::CreateDirectory($emptyGitTemplate) | Out-Null
    $env:GIT_CONFIG_GLOBAL = $emptyGitConfig
    $env:GIT_CONFIG_SYSTEM = $emptyGitConfig
    $env:GIT_TEMPLATE_DIR = $emptyGitTemplate
    $env:GIT_CONFIG_COUNT = '0'
    foreach ($name in $inheritedGitKeys) {
        Set-ProcessGitVariable $name $null
    }

    $proposalData = Read-JsonObject $proposalFile
    Assert-Keys $proposalData @('schemaVersion','proposalId','targetPath','expectedSha256','replacementText','reason') @() 'Proposal'
    if ($policyData.schemaVersion -ne 1 -or $proposalData.schemaVersion -ne 1) {
        throw 'Unsupported schemaVersion.'
    }
    if ($proposalData.proposalId -isnot [string] -or $proposalData.proposalId -cnotmatch '^[a-z0-9][a-z0-9-]{2,63}$') {
        throw 'proposalId must be 3-64 lowercase ASCII letters, digits, or hyphens.'
    }
    if ($proposalData.reason -isnot [string] -or [string]::IsNullOrWhiteSpace($proposalData.reason) -or
        $proposalData.reason.Length -gt 4096) {
        throw 'Proposal reason must be 1-4096 nonblank characters.'
    }
    if ($proposalData.replacementText -isnot [string]) {
        throw 'replacementText must be a JSON string.'
    }
    if ($policyData.allowedPaths -isnot [array] -or $policyData.allowedPaths.Count -eq 0 -or
        $policyData.allowedExtensions -isnot [array] -or $policyData.allowedExtensions.Count -eq 0 -or
        $policyData.allowNewFiles -isnot [bool] -or
        $policyData.maxCandidateBytes -isnot [long] -and $policyData.maxCandidateBytes -isnot [int] -or
        $policyData.maxCandidateBytes -lt 1 -or $policyData.maxCandidateBytes -gt 1048576) {
        throw 'Invalid policy limits.'
    }
    $builtInChecks = @('UTF8_BYTE_ROUNDTRIP','GIT_DIFF_CHECK','TYPE_PARSE','SINGLE_TARGET')
    if ($policyData.requiredChecks -isnot [array] -or
        $policyData.requiredChecks.Count -ne $builtInChecks.Count -or
        @($policyData.requiredChecks | Where-Object { $_ -cnotin $builtInChecks }).Count -ne 0 -or
        @($builtInChecks | Where-Object { $_ -cnotin $policyData.requiredChecks }).Count -ne 0) {
        throw 'Policy requiredChecks must declare the four built-in checks exactly once.'
    }
    if ($proposalData.targetPath -isnot [string] -or $proposalData.expectedSha256 -isnot [string] -or
        ($proposalData.expectedSha256 -cne 'NEW' -and $proposalData.expectedSha256 -cnotmatch '^[A-F0-9]{64}$')) {
        throw 'Proposal targetPath or expectedSha256 is invalid.'
    }
    $targetPath = $proposalData.targetPath
    Assert-RelativePath $targetPath
    if ($targetPath -cnotin @($policyData.allowedPaths)) {
        throw "Target is not on the exact allowlist: $targetPath"
    }
    $seenAllowedPaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($allowed in $policyData.allowedPaths) {
        if ($allowed -isnot [string]) { throw 'allowedPaths entries must be strings.' }
        Assert-RelativePath $allowed
        if (-not $seenAllowedPaths.Add($allowed)) { throw "Duplicate allowed path: $allowed" }
    }
    $seenExtensions = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($allowedExtension in $policyData.allowedExtensions) {
        if ($allowedExtension -isnot [string] -or $allowedExtension -cnotin @('.ps1','.json','.md') -or
            -not $seenExtensions.Add($allowedExtension)) {
            throw 'allowedExtensions must contain unique, supported lowercase extensions.'
        }
    }
    $extension = [System.IO.Path]::GetExtension($targetPath).ToLowerInvariant()
    if ($extension -notin @('.ps1','.json','.md') -or $extension -cnotin @($policyData.allowedExtensions)) {
        throw "Extension is not allowed: $extension"
    }
    $sourcePath = Assert-WithinWorkspace $workspace $targetPath
    $sourceExists = Test-Path -LiteralPath $sourcePath -PathType Leaf
    if ($sourceExists) {
        $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToUpperInvariant()
        $receipt.sourceSha256 = $sourceHash
        if ($proposalData.expectedSha256 -cne $sourceHash) {
            throw "Stale proposal: expectedSha256 does not match the current source ($sourceHash)."
        }
    } else {
        if (-not $policyData.allowNewFiles -or $proposalData.expectedSha256 -cne 'NEW') {
            throw 'New file is not permitted by policy or proposal base marker.'
        }
    }
    $encoding = New-Utf8NoBom
    $candidateBytes = $encoding.GetBytes($proposalData.replacementText)
    if ($candidateBytes.Length -gt [int]$policyData.maxCandidateBytes -or $candidateBytes.Length -eq 0) {
        throw 'Candidate is empty or exceeds maxCandidateBytes.'
    }
    if ($proposalData.replacementText.Contains([char]0)) { throw 'Candidate contains a NUL character.' }
    if ($sourceExists -and [System.Linq.Enumerable]::SequenceEqual[byte]($candidateBytes, [System.IO.File]::ReadAllBytes($sourcePath))) {
        throw 'Candidate is byte-identical to the source.'
    }

    $sandbox = Join-Path $runPath 'sandbox'
    [System.IO.Directory]::CreateDirectory($sandbox) | Out-Null
    $receipt.sandbox = $sandbox
    $safeGit = Join-Path $sandbox '.disabled-hooks'
    [System.IO.Directory]::CreateDirectory($safeGit) | Out-Null
    Invoke-Git $sandbox @('init','-q') | Out-Null
    $sandboxTarget = Join-Path $sandbox ($targetPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))
    [System.IO.Directory]::CreateDirectory((Split-Path -Parent $sandboxTarget)) | Out-Null
    if ($sourceExists) {
        [System.IO.File]::Copy($sourcePath, $sandboxTarget, $false)
        Invoke-Git $sandbox @('add','--',$targetPath) | Out-Null
    }
    Invoke-Git $sandbox @('-c',"core.hooksPath=$safeGit",'-c','user.name=HALVETH Candidate Gate','-c','user.email=local-candidate@invalid','commit','--allow-empty','-q','-m','Bound source snapshot') | Out-Null
    Invoke-Git $sandbox @('switch','-q','-c',"candidate/$($proposalData.proposalId)") | Out-Null
    [System.IO.File]::WriteAllBytes($sandboxTarget, $candidateBytes)
    $candidateHash = (Get-FileHash -LiteralPath $sandboxTarget -Algorithm SHA256).Hash.ToUpperInvariant()
    $receipt.candidateSha256 = $candidateHash
    if (-not [System.Linq.Enumerable]::SequenceEqual[byte]($candidateBytes, [System.IO.File]::ReadAllBytes($sandboxTarget))) {
        throw 'Candidate bytes changed while staging.'
    }
    $receipt.checks += [ordered]@{ name='UTF8_BYTE_ROUNDTRIP'; passed=$true; detail='Exact candidate bytes read back.' }
    Invoke-Git $sandbox @('add','--',$targetPath) | Out-Null
    $diff = Invoke-Git $sandbox @('diff','--no-ext-diff','--cached','--',$targetPath)
    $diffPath = Join-Path $runPath 'candidate.diff'
    [System.IO.File]::WriteAllText($diffPath, (($diff -join "`n") + "`n"), $encoding)
    $receipt.diffSha256 = (Get-FileHash -LiteralPath $diffPath -Algorithm SHA256).Hash.ToUpperInvariant()
    $diffCheck = & git -C $sandbox diff --no-ext-diff --cached --check 2>&1
    if ($LASTEXITCODE -ne 0) {
        $receipt.checks += [ordered]@{ name='GIT_DIFF_CHECK'; passed=$false; detail=($diffCheck -join ' ') }
        throw 'git diff --cached --check failed.'
    }
    $receipt.checks += [ordered]@{ name='GIT_DIFF_CHECK'; passed=$true; detail='No Git whitespace errors.' }
    if ($extension -eq '.json') {
        try {
            $null = ConvertFrom-Json -InputObject $proposalData.replacementText -Depth 30 -ErrorAction Stop
            $receipt.checks += [ordered]@{ name='TYPE_PARSE'; passed=$true; detail='Candidate JSON parses.' }
        } catch {
            $receipt.checks += [ordered]@{ name='TYPE_PARSE'; passed=$false; detail=$_.Exception.Message }
            throw 'Candidate JSON does not parse.'
        }
    }
    if ($extension -eq '.ps1') {
        $tokens = $null
        $parseErrors = $null
        $null = [System.Management.Automation.Language.Parser]::ParseFile($sandboxTarget, [ref]$tokens, [ref]$parseErrors)
        if ($parseErrors.Count -gt 0) {
            $receipt.checks += [ordered]@{ name='TYPE_PARSE'; passed=$false; detail=($parseErrors | ForEach-Object Message) -join ' | ' }
            throw 'Candidate PowerShell does not parse.'
        }
        $receipt.checks += [ordered]@{ name='TYPE_PARSE'; passed=$true; detail='Candidate PowerShell parses; it was not executed.' }
    }
    if ($extension -eq '.md') {
        $receipt.checks += [ordered]@{ name='TYPE_PARSE'; passed=$true; detail='UTF-8 text without NUL; no Markdown semantics asserted.' }
    }
    $changed = @(Invoke-Git $sandbox @('diff','--cached','--name-only'))
    if ($changed.Count -ne 1 -or [string]$changed[0] -cne $targetPath) {
        throw 'Staged change is not exactly the proposed target file.'
    }
    $receipt.checks += [ordered]@{ name='SINGLE_TARGET'; passed=$true; detail='Only the allowlisted target is staged.' }
    Invoke-Git $sandbox @('-c',"core.hooksPath=$safeGit",'-c','user.name=HALVETH Candidate Gate','-c','user.email=local-candidate@invalid','commit','-q','-m',"Candidate $($proposalData.proposalId)") | Out-Null
    $receipt.candidateCommit = [string]@(Invoke-Git $sandbox @('rev-parse','HEAD'))[0]
    $receipt.state = 'ELIGIBLE_FOR_HUMAN_REVIEW'
} catch {
    $receipt.errors += [string]$_.Exception.Message
} finally {
    $env:GIT_CONFIG_GLOBAL = $oldGitConfigGlobal
    $env:GIT_CONFIG_SYSTEM = $oldGitConfigSystem
    $env:GIT_TEMPLATE_DIR = $oldGitTemplateDir
    $env:GIT_CONFIG_COUNT = $oldGitConfigCount
    foreach ($name in $inheritedGitKeys) {
        Set-ProcessGitVariable $name $inheritedGitValues[$name]
    }
    if ($null -ne $runPath) {
        $receipt.completedAt = (Get-Date).ToUniversalTime().ToString('o')
        $receiptPath = Join-Path $runPath 'receipt.json'
        [System.IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json -Depth 20), (New-Utf8NoBom))
        Write-Output $receiptPath
    } else {
        Write-Error ($receipt.errors -join ' | ')
    }
}
if ($receipt.state -eq 'ELIGIBLE_FOR_HUMAN_REVIEW') { exit 0 }
exit 2
