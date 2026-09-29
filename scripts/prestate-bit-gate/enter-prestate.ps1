$Engine = Join-Path $env:LOCALAPPDATA 'HALVETH\PRESTATE_BIT_GATE\prestate-bit-gate.ps1'

& $Engine -Action Start | Out-Null

function global:bit {
    param(
        [Parameter(Mandatory=$true,Position=0)]
        [string]$Command,

        [switch]$AcceptMutation
    )

    & $Engine `
        -Action Run `
        -Shell Auto `
        -CommandText $Command `
        -AcceptMutation:$AcceptMutation
}

function global:psbit {
    param(
        [Parameter(Mandatory=$true,Position=0)]
        [string]$Command,

        [switch]$AcceptMutation
    )

    & $Engine `
        -Action Run `
        -Shell PowerShell `
        -CommandText $Command `
        -AcceptMutation:$AcceptMutation
}

function global:cmdbit {
    param(
        [Parameter(Mandatory=$true,Position=0)]
        [string]$Command,

        [switch]$AcceptMutation
    )

    & $Engine `
        -Action Run `
        -Shell Cmd `
        -CommandText $Command `
        -AcceptMutation:$AcceptMutation
}

function global:shadow {
    & $Engine -Action Close
}

function global:prestate {
    & $Engine -Action Status
}

function global:prompt {
    'HALVETH :: PRESTATE [ACTIVE] :: JURI:\> '
}

Write-Host ''
Write-Host '╔══════════════════════════════════════════════╗'
Write-Host '║ HALVETH PRESTATE BIT GATE                  ║'
Write-Host '╚══════════════════════════════════════════════╝'
Write-Host ''
Write-Host 'bit     "Get-Process"'
Write-Host 'psbit   "$PSVersionTable"'
Write-Host 'cmdbit  "dir"'
Write-Host 'prestate'
Write-Host 'shadow'
Write-Host ''