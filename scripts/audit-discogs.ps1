$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$directory = Join-Path $root '.work'
$token = (Get-Content -LiteralPath (Join-Path $directory 'discogs-token.dpapi') -Raw).Trim() | ConvertTo-SecureString
$pointer = [IntPtr]::Zero
try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
    $headers = @{Authorization = ('Discogs token=' + [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()); 'User-Agent' = 'RichardsRecords/1.0 +https://richardsrecords.netlify.app/'}
    function Read-Discogs([string]$uri) {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -Headers $headers -TimeoutSec 30
        return ([Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | ConvertFrom-Json)
    }
    $identity = Read-Discogs 'https://api.discogs.com/oauth/identity'
    $username = [Uri]::EscapeDataString($identity.username)
    $items = @()
    $page = 1
    do {
        $result = Read-Discogs "https://api.discogs.com/users/$username/collection/folders/0/releases?per_page=100&page=$page"
        $items += $result.releases
        $page++
        Start-Sleep -Milliseconds 1100
    } while ($page -le $result.pagination.pages)
    $items | ConvertTo-Json -Depth 30 | Set-Content (Join-Path $directory 'discogs-existing.json') -Encoding UTF8
    $catalogue = Get-Content (Join-Path $root 'public/data/collection.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $auditEntries = @()
    foreach ($album in $catalogue.albums) {
        if ($album.discogsUrl -match '/release/(\d+)') {
            $releaseId = $Matches[1]
            Start-Sleep -Milliseconds 1100
            $release = Read-Discogs "https://api.discogs.com/releases/$releaseId"
            $auditEntries += @{albumId=$album.id; localArtist=$album.artistEn; localTitle=$album.titleEn; localCatalogue=$album.catalogNumber; localYear=$album.year; release=$release; existingCopies=@($items | Where-Object {$_.id -eq [int]$releaseId}).Count}
        }
    }
    ConvertTo-Json -InputObject $auditEntries -Depth 40 | Set-Content (Join-Path $directory 'discogs-release-audit.json') -Encoding UTF8
    Write-Host "Account: $($identity.username). Existing collection: $($items.Count) copies. Fetched $($auditEntries.Count) linked releases. No changes made to Discogs."
} catch {
    Write-Host ($_.Exception.GetType().FullName + ' at line ' + $_.InvocationInfo.ScriptLineNumber); Write-Host 'Discogs audit failed. No writes were made to Discogs. Check network/access and retry.'
    exit 1
} finally {
    if ($pointer -ne [IntPtr]::Zero) {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
    $headers=$null
    $token.Dispose()
}





