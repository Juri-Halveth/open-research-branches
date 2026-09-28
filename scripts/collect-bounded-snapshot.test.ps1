# SPDX-License-Identifier: MIT
# Dependency-free synthetic tests for collect-bounded-snapshot.ps1.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$scriptUnderTest = Join-Path $PSScriptRoot 'collect-bounded-snapshot.ps1'
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('bounded-snapshot-test-' + [guid]::NewGuid().ToString('N'))
$scratchFull = [IO.Path]::GetFullPath($scratch)
$tempFull = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
if (-not $scratchFull.StartsWith($tempFull, [StringComparison]::OrdinalIgnoreCase)) { throw 'Scratch path escaped the temporary directory.' }

try {
    $inputFolder = Join-Path $scratch 'input'
    $outputFolder = Join-Path $scratch 'output'
    [IO.Directory]::CreateDirectory($inputFolder) | Out-Null
    [IO.Directory]::CreateDirectory($outputFolder) | Out-Null
    [IO.File]::WriteAllText((Join-Path $inputFolder 'alpha.txt'), 'synthetic alpha')
    [IO.File]::WriteAllText((Join-Path $inputFolder 'beta.txt'), 'synthetic beta')

    $firstOutput = Join-Path $outputFolder 'first.json'
    & $scriptUnderTest -InputDirectory $inputFolder -OutputFile $firstOutput -MaxFiles 10 | Out-Null
    $first = Get-Content -LiteralPath $firstOutput -Raw | ConvertFrom-Json
    if ($first.coverage.fileRows -ne 2 -or $first.coverage.gapRows -ne 0 -or $first.coverage.truncated) {
        throw 'Expected two hashed synthetic files and no gaps.'
    }
    if ($first.files[0].relativePath -ne 'alpha.txt' -or $first.files[1].relativePath -ne 'beta.txt') {
        throw 'Expected sorted relative paths.'
    }
    if ($first.files[0].sha256 -ne (Get-FileHash -LiteralPath (Join-Path $inputFolder 'alpha.txt') -Algorithm SHA256).Hash.ToLowerInvariant()) {
        throw 'SHA-256 mismatch for alpha.txt.'
    }
    if ((Get-Content -LiteralPath $firstOutput -Raw).Contains($scratchFull)) {
        throw 'The record contains the absolute scratch path.'
    }

    $repeatFailed = $false
    try { & $scriptUnderTest -InputDirectory $inputFolder -OutputFile $firstOutput | Out-Null } catch { $repeatFailed = $true }
    if (-not $repeatFailed) { throw 'Existing output must not be overwritten.' }

    $insideFailed = $false
    try { & $scriptUnderTest -InputDirectory $inputFolder -OutputFile (Join-Path $inputFolder 'inside.json') | Out-Null } catch { $insideFailed = $true }
    if (-not $insideFailed) { throw 'Output inside input must be rejected.' }

    $boundedOutput = Join-Path $outputFolder 'bounded.json'
    & $scriptUnderTest -InputDirectory $inputFolder -OutputFile $boundedOutput -MaxFiles 1 | Out-Null
    $bounded = Get-Content -LiteralPath $boundedOutput -Raw | ConvertFrom-Json
    if (-not $bounded.coverage.truncated -or $bounded.coverage.fileRows -ne 1) {
        throw 'The file cap must be visible as truncation.'
    }

    $sizeOutput = Join-Path $outputFolder 'size-limited.json'
    & $scriptUnderTest -InputDirectory $inputFolder -OutputFile $sizeOutput -MaxFileBytes 5 | Out-Null
    $sizeLimited = Get-Content -LiteralPath $sizeOutput -Raw | ConvertFrom-Json
    if ($sizeLimited.coverage.gapRows -ne 2 -or $sizeLimited.files[0].state -ne 'SKIPPED_SIZE_LIMIT') {
        throw 'Files above the declared byte cap must be visible as gaps.'
    }
    'bounded-snapshot tests passed'
} finally {
    if ([IO.Directory]::Exists($scratchFull)) { Remove-Item -LiteralPath $scratchFull -Recurse -Force }
}
