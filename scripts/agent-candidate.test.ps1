# SPDX-License-Identifier: MIT
# Synthetic, offline tests for agent-candidate.ps1.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$tool = Join-Path $PSScriptRoot 'agent-candidate.ps1'
$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd(
    [System.IO.Path]::DirectorySeparatorChar
) + [System.IO.Path]::DirectorySeparatorChar
$testRoot = [System.IO.Path]::GetFullPath((Join-Path $tempRoot ('agent-candidate-test-' + [guid]::NewGuid().ToString('N'))))
if (-not $testRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Synthetic test root escaped the operating-system temporary directory.'
}
$utf8 = [System.Text.UTF8Encoding]::new($false, $true)
$oldGitDir = $env:GIT_DIR
$oldExternalDiff = $env:GIT_EXTERNAL_DIFF

function Write-Json([string]$Path, [object]$Value) {
    [System.IO.File]::WriteAllText($Path, ($Value | ConvertTo-Json -Depth 20), $utf8)
}

function Invoke-Case([string]$Name, [System.Collections.IDictionary]$ProposalData,
    [string]$ExpectedState, [int]$ExpectedExit) {
    $proposalPath = Join-Path $proposalRoot ($Name + '.json')
    Write-Json $proposalPath $ProposalData
    $output = @(& pwsh -NoProfile -File $tool -Policy $policyPath -Proposal $proposalPath -RunRoot $runRoot)
    $exitCode = $LASTEXITCODE
    if ($output.Count -lt 1) { throw "$Name produced no receipt path." }
    $receiptPath = [string]$output[-1]
    $receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json -AsHashtable
    if ($exitCode -ne $ExpectedExit -or $receipt.state -cne $ExpectedState) {
        throw "$Name expected $ExpectedState/$ExpectedExit; got $($receipt.state)/$exitCode. Errors: $($receipt.errors -join ' | ')"
    }
    if ($receipt.externalWrite -ne $false -or $receipt.sourceWrite -ne $false) {
        throw "$Name reported an unexpected external or source write."
    }
    if ($ExpectedState -ceq 'ELIGIBLE_FOR_HUMAN_REVIEW') {
        if ($receipt.checks.Count -ne 4 -or @($receipt.checks | Where-Object { -not $_.passed }).Count -ne 0) {
            throw "$Name did not pass all four declared checks."
        }
        if ($receipt.candidateCommit -cnotmatch '^[a-f0-9]{40,64}$') {
            throw "$Name has no local candidate commit."
        }
        $diff = Join-Path (Split-Path -Parent $receiptPath) 'candidate.diff'
        if (-not (Test-Path -LiteralPath $diff -PathType Leaf)) { throw "$Name has no reviewable diff." }
    }
    return $receipt
}

try {
    $sourceRoot = Join-Path $testRoot 'source'
    $proposalRoot = Join-Path $testRoot 'proposals'
    $runRoot = Join-Path $testRoot 'runs'
    foreach ($directory in @($sourceRoot, $proposalRoot, $runRoot, (Join-Path $sourceRoot 'notes'), (Join-Path $sourceRoot 'scripts'))) {
        [System.IO.Directory]::CreateDirectory($directory) | Out-Null
    }
    $notePath = Join-Path $sourceRoot 'notes/field-guide.md'
    $scriptPath = Join-Path $sourceRoot 'scripts/spell.ps1'
    [System.IO.File]::WriteAllText($notePath, "# Field note`nOriginal bytes.`n", $utf8)
    [System.IO.File]::WriteAllText($scriptPath, "Write-Output 'original'`n", $utf8)
    $noteHash = (Get-FileHash -LiteralPath $notePath -Algorithm SHA256).Hash.ToUpperInvariant()
    $scriptHash = (Get-FileHash -LiteralPath $scriptPath -Algorithm SHA256).Hash.ToUpperInvariant()
    # A caller's Git environment must not redirect the sandbox or launch a diff helper.
    $env:GIT_DIR = Join-Path $testRoot 'inherited-git-dir'
    $env:GIT_EXTERNAL_DIFF = Join-Path $testRoot 'inherited-diff-helper'
    $policyPath = Join-Path $testRoot 'policy.json'
    Write-Json $policyPath ([ordered]@{
        schemaVersion = 1
        workspaceRoot = 'source'
        allowedPaths = @('notes/field-guide.md', 'scripts/spell.ps1', 'data/new.json', 'data/invalid.json')
        allowedExtensions = @('.md', '.ps1', '.json')
        allowNewFiles = $true
        maxCandidateBytes = 16384
        requiredChecks = @('UTF8_BYTE_ROUNDTRIP', 'GIT_DIFF_CHECK', 'TYPE_PARSE', 'SINGLE_TARGET')
    })

    $cases = @(
        @{ name='valid-markdown'; state='ELIGIBLE_FOR_HUMAN_REVIEW'; exit=0; data=@{ schemaVersion=1; proposalId='valid-markdown'; targetPath='notes/field-guide.md'; expectedSha256=$noteHash; replacementText="# Field note`nOriginal bytes.`nReviewed addition.`n"; reason='synthetic edit' } },
        @{ name='valid-new-json'; state='ELIGIBLE_FOR_HUMAN_REVIEW'; exit=0; data=@{ schemaVersion=1; proposalId='valid-new-json'; targetPath='data/new.json'; expectedSha256='NEW'; replacementText='{ "new": true }'; reason='synthetic new file' } },
        @{ name='stale-base'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='stale-base'; targetPath='notes/field-guide.md'; expectedSha256=('0' * 64); replacementText='stale'; reason='synthetic stale base' } },
        @{ name='path-traversal'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='path-traversal'; targetPath='../outside.md'; expectedSha256='NEW'; replacementText='outside'; reason='synthetic traversal' } },
        @{ name='unlisted-target'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='unlisted-target'; targetPath='notes/other.md'; expectedSha256='NEW'; replacementText='unlisted'; reason='synthetic unlisted file' } },
        @{ name='invalid-powershell'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='invalid-powershell'; targetPath='scripts/spell.ps1'; expectedSha256=$scriptHash; replacementText='function broken {'; reason='synthetic parser case' } },
        @{ name='invalid-json'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='invalid-json'; targetPath='data/invalid.json'; expectedSha256='NEW'; replacementText='{ "broken": '; reason='synthetic parser case' } },
        @{ name='no-op'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='no-op'; targetPath='notes/field-guide.md'; expectedSha256=$noteHash; replacementText="# Field note`nOriginal bytes.`n"; reason='synthetic no-op' } },
        @{ name='bad-hash-type'; state='REJECTED'; exit=2; data=@{ schemaVersion=1; proposalId='bad-hash-type'; targetPath='notes/field-guide.md'; expectedSha256='bad'; replacementText='changed'; reason='synthetic bad hash' } }
    )
    $tested = 0
    foreach ($case in $cases) {
        $null = Invoke-Case $case.name $case.data $case.state $case.exit
        $tested++
    }

    $marker = Join-Path $testRoot 'injection-marker'
    $inertText = '$(New-Item -ItemType File -Path INJECTION_MARKER)'
    $receipt = Invoke-Case 'inert-proposal-text' @{
        schemaVersion=1; proposalId='inert-proposal-text'; targetPath='notes/field-guide.md'
        expectedSha256=$noteHash; replacementText=$inertText; reason='synthetic inert text'
    } 'ELIGIBLE_FOR_HUMAN_REVIEW' 0
    if (Test-Path -LiteralPath $marker) { throw 'Proposal text executed unexpectedly.' }
    if ((Get-FileHash -LiteralPath $notePath -Algorithm SHA256).Hash.ToUpperInvariant() -cne $noteHash -or
        (Get-FileHash -LiteralPath $scriptPath -Algorithm SHA256).Hash.ToUpperInvariant() -cne $scriptHash -or
        (Test-Path -LiteralPath (Join-Path $sourceRoot 'data'))) {
        throw 'Synthetic source workspace changed.'
    }
    $tested++
    Write-Output "agent-candidate tests passed: $tested synthetic cases; source unchanged"
} finally {
    $env:GIT_DIR = $oldGitDir
    $env:GIT_EXTERNAL_DIFF = $oldExternalDiff
    $resolved = [System.IO.Path]::GetFullPath($testRoot)
    if ($resolved.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
        $resolved -cne $tempRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) -and
        [System.IO.Directory]::Exists($resolved)) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}
