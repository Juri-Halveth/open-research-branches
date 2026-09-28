# SPDX-License-Identifier: MIT
# A local, bounded file-hash observation. The caller chooses both paths.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InputDirectory,
    [Parameter(Mandatory = $true)][string]$OutputFile,
    [ValidateRange(1, 1000000)][int]$MaxFiles = 10000,
    [ValidateRange(1, 1099511627776)][long]$MaxFileBytes = 67108864
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$startedAt = [DateTimeOffset]::UtcNow.ToString('o')
$root = [IO.Path]::GetFullPath((Resolve-Path -LiteralPath $InputDirectory -ErrorAction Stop).ProviderPath)
$rootPrefix = [IO.Path]::GetPathRoot($root)
if ($root.Length -gt $rootPrefix.Length) { $root = $root.TrimEnd('\', '/') }
if (-not [IO.Directory]::Exists($root)) { throw 'InputDirectory must be a directory.' }
if (((Get-Item -LiteralPath $root).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw 'A reparse-point input root is not supported.'
}

$output = [IO.Path]::GetFullPath($OutputFile)
$comparison = [StringComparison]::OrdinalIgnoreCase
$insidePrefix = if ($root.EndsWith([string][IO.Path]::DirectorySeparatorChar)) { $root } else { $root + [IO.Path]::DirectorySeparatorChar }
if ($output.Equals($root, $comparison) -or $output.StartsWith($insidePrefix, $comparison)) {
    throw 'OutputFile must be outside InputDirectory.'
}
if ([IO.File]::Exists($output)) { throw 'OutputFile already exists; choose a new path.' }
$outputParent = [IO.Path]::GetDirectoryName($output)
if (-not [IO.Directory]::Exists($outputParent)) { throw 'OutputFile parent directory must already exist.' }

function Get-RelativeName([string]$fullPath) {
    if ($fullPath.Equals($root, $comparison)) { return '.' }
    return $fullPath.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
}

$pending = New-Object 'System.Collections.Generic.Stack[string]'
$pending.Push($root)
$files = New-Object 'System.Collections.Generic.List[object]'
$gaps = New-Object 'System.Collections.Generic.List[object]'
$skippedReparsePoints = 0
$truncated = $false

:scan while ($pending.Count -gt 0) {
    $directory = $pending.Pop()
    try {
        $entries = @(Get-ChildItem -LiteralPath $directory -Force -ErrorAction Stop | Sort-Object -Property Name)
    } catch {
        $gaps.Add([pscustomobject][ordered]@{ relativePath = (Get-RelativeName $directory); reason = 'ENUMERATION_ERROR' })
        continue
    }
    foreach ($entry in $entries) {
        if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            $skippedReparsePoints++
            continue
        }
        if ($entry.PSIsContainer) {
            $pending.Push($entry.FullName)
            continue
        }
        if ($files.Count -ge $MaxFiles) {
            $truncated = $true
            break scan
        }
        $relativeName = Get-RelativeName $entry.FullName
        if ($entry.Length -gt $MaxFileBytes) {
            $files.Add([pscustomobject][ordered]@{ relativePath = $relativeName; byteLength = [long]$entry.Length; sha256 = $null; state = 'SKIPPED_SIZE_LIMIT' })
            $gaps.Add([pscustomobject][ordered]@{ relativePath = $relativeName; reason = 'SKIPPED_SIZE_LIMIT' })
            continue
        }
        try {
            $beforeLength = $entry.Length
            $beforeWrite = $entry.LastWriteTimeUtc
            $digest = (Get-FileHash -LiteralPath $entry.FullName -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()
            $after = Get-Item -LiteralPath $entry.FullName -ErrorAction Stop
            $state = if ($beforeLength -eq $after.Length -and $beforeWrite -eq $after.LastWriteTimeUtc) {
                'HASHED_AT_SCAN_TIME'
            } else {
                'CHANGED_DURING_SCAN'
            }
            $files.Add([pscustomobject][ordered]@{
                relativePath = $relativeName
                byteLength = [long]$after.Length
                sha256 = $digest
                state = $state
            })
            if ($state -eq 'CHANGED_DURING_SCAN') {
                $gaps.Add([pscustomobject][ordered]@{ relativePath = $relativeName; reason = $state })
            }
        } catch {
            $files.Add([pscustomobject][ordered]@{ relativePath = $relativeName; byteLength = $null; sha256 = $null; state = 'READ_ERROR' })
            $gaps.Add([pscustomobject][ordered]@{ relativePath = $relativeName; reason = 'READ_ERROR' })
        }
    }
}

$fileRows = @($files | Sort-Object -Property relativePath)
$gapRows = @($gaps | Sort-Object -Property relativePath)
$record = [ordered]@{
    schemaVersion = '1.0.0'
    startedAtUtc = $startedAt
    completedAtUtc = [DateTimeOffset]::UtcNow.ToString('o')
    sourceRoot = 'EXPLICIT_LOCAL_ARGUMENT_OMITTED'
    coverage = [ordered]@{
        maxFiles = $MaxFiles
        maxFileBytes = $MaxFileBytes
        truncated = $truncated
        skippedReparsePoints = $skippedReparsePoints
        fileRows = $fileRows.Count
        gapRows = $gapRows.Count
    }
    files = $fileRows
    gaps = $gapRows
    claimCeiling = 'HASHED_FILES_AT_SCAN_TIME_WITHIN_DECLARED_COVERAGE_ONLY'
}

$temporary = Join-Path $outputParent ('.bounded-snapshot-' + [guid]::NewGuid().ToString('N') + '.tmp')
try {
    $json = ConvertTo-Json -InputObject $record -Depth 8
    [IO.File]::WriteAllText($temporary, $json + [Environment]::NewLine, (New-Object System.Text.UTF8Encoding($false)))
    [IO.File]::Move($temporary, $output)
} finally {
    if ([IO.File]::Exists($temporary)) { [IO.File]::Delete($temporary) }
}

[pscustomobject]@{
    outputFile = $output
    fileRows = $fileRows.Count
    gapRows = $gapRows.Count
    truncated = $truncated
}
