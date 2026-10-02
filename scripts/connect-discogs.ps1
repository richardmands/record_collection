# Run interactively in PowerShell. Never pass the token as an argument.
$ErrorActionPreference = 'Stop'
$token = Read-Host 'Paste your Discogs personal access token (input is hidden)' -AsSecureString
$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
    $plainToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainToken)) { throw 'Empty token' }
    $headers = @{ Authorization = "Discogs token=$plainToken"; 'User-Agent' = 'RichardsRecords/1.0 +https://richardsrecords.netlify.app/' }
    $identity = Invoke-RestMethod -Uri 'https://api.discogs.com/oauth/identity' -Headers $headers -TimeoutSec 30
    if (-not $identity.username) { throw 'No account returned' }
    $directory = Join-Path (Split-Path $PSScriptRoot -Parent) '.work'
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    # Without a supplied encryption key, Windows protects this using DPAPI.
    $token | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $directory 'discogs-token.dpapi')
    @{ username = $identity.username; connectedAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directory 'discogs-account.json')
    Write-Host "Connected to Discogs as $($identity.username). Token saved encrypted for this Windows account. No records were added."
} catch {
    Write-Host 'Connection failed. Check the token and network, then run this script again. No new token was saved.'
    exit 1
} finally {
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    $plainToken = $null
    $headers = $null
    $token.Dispose()
}
