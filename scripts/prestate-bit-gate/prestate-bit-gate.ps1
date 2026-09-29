param(
    [ValidateSet('Start','Run','Close','Status')]
    [string]$Action='Status',

    [string]$CommandText,

    [ValidateSet('Auto','PowerShell','Cmd')]
    [string]$Shell='Auto',

    [switch]$AcceptMutation
)

Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'

$Root = Join-Path $env:LOCALAPPDATA 'HALVETH\PRESTATE_BIT_GATE'

$Policy = Join-Path $Root 'policy.json'
$State  = Join-Path $Root 'state.json'
$Ledger = Join-Path $Root 'ledger.jsonl'
$Certs  = Join-Path $Root 'certificates'

New-Item -ItemType Directory -Force -Path $Root,$Certs | Out-Null

function HashText {
    param([string]$Text)

    $sha=[Security.Cryptography.SHA256]::Create()

    try {
        $bytes=[Text.Encoding]::UTF8.GetBytes($Text)

        return (
            ($sha.ComputeHash($bytes) | ForEach-Object {
                $_.ToString('x2')
            }) -join ''
        ).ToUpperInvariant()
    }
    finally {
        $sha.Dispose()
    }
}

function SaveJson {
    param(
        [string]$Path,
        $Value
    )

    $Value |
        ConvertTo-Json -Depth 30 |
        Set-Content -LiteralPath $Path -Encoding UTF8
}

function LoadJson {
    param([string]$Path)

    if(!(Test-Path -LiteralPath $Path)){
        return $null
    }

    Get-Content -LiteralPath $Path -Raw |
        ConvertFrom-Json
}

function LedgerHead {

    if(!(Test-Path -LiteralPath $Ledger)){
        return 'GENESIS'
    }

    $Last=Get-Content -LiteralPath $Ledger -Tail 1

    if([string]::IsNullOrWhiteSpace($Last)){
        return 'GENESIS'
    }

    return [string](($Last | ConvertFrom-Json).event_sha256)
}

function AddEvent {

    param(
        [string]$Type,
        [hashtable]$Data=@{}
    )

    $Previous=LedgerHead

    $Base=[ordered]@{
        schema='HALVETH_PRESTATE_EVENT_1'
        event_id=[guid]::NewGuid().ToString()
        at=(Get-Date).ToString('o')
        type=$Type
        previous_sha256=$Previous
        data=$Data
    }

    $Material=
        $Base |
        ConvertTo-Json -Depth 30 -Compress

    $Base.event_sha256=HashText $Material

    (
        $Base |
        ConvertTo-Json -Depth 30 -Compress
    ) |
        Add-Content -LiteralPath $Ledger -Encoding UTF8

    return $Base
}

if(!(Test-Path -LiteralPath $Policy)){

    SaveJson $Policy ([ordered]@{
        schema='HALVETH_PRESTATE_POLICY_1'

        invariants=@(
            'NO_EXECUTION_BEFORE_PRESTATE',
            'BIT_REQUEST != BIT_EXECUTION',
            'UNKNOWN = PRESERVED',
            'UNKNOWN != FALSE',
            'SIMILARITY != CAUSALITY',
            'TRUTH = SEPARATE_DIMENSION',
            'OPEN != UNCONTROLLED',
            'EXPANSION = ADDITIVE + REVERSIBLE + MEASURABLE',
            'NAME != CONTENT'
        )

        mutable_requires_explicit_acceptance=$true

        shadow='LOGICAL_NO_EXECUTION_STATE'
    })
}

function New-HVNonce {

    $Bytes=New-Object byte[] 32
    $Rng=[Security.Cryptography.RandomNumberGenerator]::Create()

    try {
        $Rng.GetBytes($Bytes)
    }
    finally {
        $Rng.Dispose()
    }

    return [Convert]::ToBase64String($Bytes)
}
function StartSession {

    $Existing=LoadJson $State

    if($Existing -and $Existing.state -eq 'ACTIVE'){
        return $Existing
    }

    $S=[ordered]@{
        schema='HALVETH_PRESTATE_SESSION_1'
        state='ACTIVE'
        session_id=[guid]::NewGuid().ToString()
        opened_at=(Get-Date).ToString('o')
        nonce=(New-HVNonce)
        policy_sha256=(Get-FileHash $Policy -Algorithm SHA256).Hash
        opening_ledger_head=LedgerHead
    }

    SaveJson $State $S

    AddEvent 'PRESTATE_CREATED' @{
        session_id=$S.session_id
        policy_sha256=$S.policy_sha256
    } | Out-Null

    return $S
}

function ChooseShell {

    param(
        [string]$Text,
        [string]$Requested
    )

    if($Requested -ne 'Auto'){
        return $Requested
    }

    if(
        $Text -match
        '(^|\s)(\$[A-Za-z_]|Get-|Set-|New-|Remove-|Test-|Join-|Where-Object|ForEach-Object|Invoke-|Start-|Stop-|\[[A-Za-z])'
    ){
        return 'PowerShell'
    }

    if(
        $Text -match
        '(?i)(^|\s)(dir|copy|xcopy|type|set|echo|findstr|where|ver|cd|md|rd|del|erase)(\s|$)'
    ){
        return 'Cmd'
    }

    return 'PowerShell'
}

function IsMutable {

    param([string]$Text)

    $Patterns=@(
        '(?i)\b(Remove-Item|Clear-Content|Set-Content|Move-Item|Rename-Item|Set-ItemProperty|Remove-ItemProperty|Stop-Process)\b',
        '(?i)\b(del|erase|rd|rmdir|move|ren|reg\s+add|reg\s+delete|sc\s+delete|shutdown|format|diskpart|takeown|icacls)\b',
        '(?i)\b(Clear-Disk|Initialize-Disk|Remove-Partition|Format-Volume)\b'
    )

    foreach($Pattern in $Patterns){

        if($Text -match $Pattern){
            return $true
        }
    }

    return $false
}

function InvokeBit {

    param(
        [string]$Text,
        [string]$RequestedShell,
        [switch]$MutationAccepted
    )

    if([string]::IsNullOrWhiteSpace($Text)){
        throw 'BIT_REQUEST_EMPTY'
    }

    $Session=StartSession

    $Chosen=ChooseShell $Text $RequestedShell

    $CommandHash=HashText $Text

    $Mutable=IsMutable $Text

    AddEvent 'BIT_RECEIVED' @{
        session_id=$Session.session_id
        shell=$Chosen
        command_sha256=$CommandHash
        mutable=$Mutable
    } | Out-Null

    if($Mutable -and !$MutationAccepted){

        AddEvent 'PRESERVED_NOT_EXECUTED' @{
            session_id=$Session.session_id
            command_sha256=$CommandHash
            reason='MUTABLE_REQUIRES_EXPLICIT_ACCEPTANCE'
        } | Out-Null

        Write-Host ''
        Write-Host 'PRESERVED // NOT EXECUTED'
        Write-Host 'Use -AcceptMutation for this exact request.'
        Write-Host ''

        return
    }

    AddEvent 'BIT_ACCEPTED' @{
        session_id=$Session.session_id
        command_sha256=$CommandHash
        shell=$Chosen
    } | Out-Null

    $CommandRoot=Join-Path $Root 'commands'
    New-Item -ItemType Directory -Force -Path $CommandRoot | Out-Null

    $CommandId=[guid]::NewGuid().ToString('N')

    $Info=[Diagnostics.ProcessStartInfo]::new()
    $Info.UseShellExecute=$false
    $Info.RedirectStandardOutput=$true
    $Info.RedirectStandardError=$true
    $Info.CreateNoWindow=$true

    if($Chosen -eq 'Cmd'){

        $CommandFile=Join-Path $CommandRoot ('BIT_'+$CommandId+'.cmd')

        [IO.File]::WriteAllText(
            $CommandFile,
            $Text,
            [Text.Encoding]::Default
        )

        $Info.FileName=$env:ComSpec
        $Info.Arguments='/d /s /c ""'+$CommandFile+'""'
    }
    else{

        $CommandFile=Join-Path $CommandRoot ('BIT_'+$CommandId+'.ps1')

        [IO.File]::WriteAllText(
            $CommandFile,
            $Text,
            [Text.UTF8Encoding]::new($true)
        )

        $Info.FileName=(Get-Command powershell.exe).Source
        $Info.Arguments='-NoLogo -NoProfile -NonInteractive -File "'+$CommandFile+'"'
    }

    $Watch=[Diagnostics.Stopwatch]::StartNew()

    $Process=[Diagnostics.Process]::new()

    $Process.StartInfo=$Info

    [void]$Process.Start()

    $StdOut=$Process.StandardOutput.ReadToEnd()
    $StdErr=$Process.StandardError.ReadToEnd()

    $Process.WaitForExit()

    $Watch.Stop()

    AddEvent 'BIT_PRESERVED' @{
        session_id=$Session.session_id
        shell=$Chosen
        command_sha256=$CommandHash
        exit_code=$Process.ExitCode
        elapsed_ms=[math]::Round(
            $Watch.Elapsed.TotalMilliseconds,
            3
        )
        stdout_sha256=HashText $StdOut
        stderr_sha256=HashText $StdErr
    } | Out-Null

    if($StdOut){
        Write-Output $StdOut.TrimEnd()
    }

    if($StdErr){
        Write-Warning $StdErr.TrimEnd()
    }
}

function CloseSession {

    $S=LoadJson $State

    if(!$S -or $S.state -ne 'ACTIVE'){

        Write-Host 'SHADOW'
        return
    }

    $Final=AddEvent 'RETURN_TO_SHADOW' @{
        session_id=$S.session_id
        logical_gap='UNBOUNDED_LABEL_ONLY'
    }

    $Certificate=[ordered]@{
        schema='HALVETH_PRESTATE_CERTIFICATE_1'
        session_id=$S.session_id
        opened_at=$S.opened_at
        closed_at=(Get-Date).ToString('o')
        policy_sha256=$S.policy_sha256
        opening_ledger_head=$S.opening_ledger_head
        closing_ledger_head=$Final.event_sha256
        shadow='LOGICAL_NO_EXECUTION_STATE'
        claim_ceiling='LOCAL_SESSION_PROVENANCE_NOT_EXTERNAL_TIMESTAMP_OR_LEGAL_TITLE'
    }

    $CertPath=
        Join-Path $Certs (
            $S.session_id + '.json'
        )

    SaveJson $CertPath $Certificate

    SaveJson $State ([ordered]@{
        state='SHADOW'
        last_session_id=$S.session_id
        closed_at=$Certificate.closed_at
        certificate=$CertPath
    })

    Write-Host ''
    Write-Host 'RETURNED TO SHADOW'
    Write-Host "CERTIFICATE: $CertPath"
}

switch($Action){

    'Start' {
        StartSession | Format-List
    }

    'Run' {
        InvokeBit `
            -Text $CommandText `
            -RequestedShell $Shell `
            -MutationAccepted:$AcceptMutation
    }

    'Close' {
        CloseSession
    }

    'Status' {

        $S=LoadJson $State

        if($S){
            $S | Format-List
        }
        else{
            Write-Host 'SHADOW'
        }

        Write-Host ''
        Write-Host "LEDGER HEAD : $(LedgerHead)"
        Write-Host "POLICY HASH : $((Get-FileHash $Policy -Algorithm SHA256).Hash)"
    }
}