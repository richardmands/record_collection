param([string]$OnlyRecordId = '')
# Explicit reviewed batch. Never retry an uncertain POST automatically.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$directory = Join-Path $root '.work'
$token = (Get-Content (Join-Path $directory 'discogs-token.dpapi') -Raw).Trim() | ConvertTo-SecureString
$pointer = [IntPtr]::Zero
$ledgerPath = Join-Path $directory 'discogs-import-ledger.json'
$ledger = @()
if (Test-Path $ledgerPath) { $ledger = @(Get-Content $ledgerPath -Raw -Encoding UTF8 | ConvertFrom-Json) }
try {
 $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
 $headers = @{Authorization=('Discogs token='+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim());'User-Agent'='RichardsRecords/1.0 +https://richardsrecords.netlify.app/'}
 function Read-Discogs([string]$uri) {
  $response=Invoke-WebRequest -UseBasicParsing -Uri $uri -Headers $headers -TimeoutSec 30
  [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | ConvertFrom-Json
 }
 $identity=Read-Discogs 'https://api.discogs.com/oauth/identity'
 if($identity.username -ne 'thejapanexperience'){throw 'Unexpected account'}
 $base='https://api.discogs.com/users/thejapanexperience/collection'
 $existing=@();$page=1
 do {
  $result=Read-Discogs "$base/folders/0/releases?per_page=100&page=$page"
  $existing+= $result.releases;$page++;Start-Sleep -Milliseconds 1100
 }while($page -le $result.pagination.pages)
 $reviewed=Get-Content (Join-Path $root 'data/research/discogs-matches.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $occurrences=@{}
 foreach($property in @($reviewed.psobject.Properties | Sort-Object {[int]$_.Name})){
  $id=$property.Name;$releaseId=$property.Value
  if($OnlyRecordId -and $id -ne $OnlyRecordId){continue}
  $occurrences[$releaseId]=1+$occurrences[$releaseId]
  if(@($existing | Where-Object {$_.id -eq $releaseId}).Count -ge $occurrences[$releaseId]){Write-Host "Already present: record $id";continue}
  if(@($ledger | Where-Object {$_.albumId -eq $id}).Count -gt 0){throw 'Previous attempt requires reconciliation'}
  $attempt=@{albumId=$id;releaseId=$releaseId;status='attempting';at=[DateTime]::UtcNow.ToString('o')}
  $ledger+=$attempt
  ConvertTo-Json -InputObject $ledger -Depth 10 | Set-Content $ledgerPath -Encoding UTF8
  Start-Sleep -Milliseconds 2600
  $response=Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$base/folders/1/releases/$releaseId" -Headers $headers -ContentType 'application/json' -Body '{}' -TimeoutSec 30
  $added=[Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | ConvertFrom-Json
  if(-not $added.instance_id){throw 'Missing instance ID'}
  $attempt.status='added';$attempt.instanceId=$added.instance_id
  ConvertTo-Json -InputObject $ledger -Depth 10 | Set-Content $ledgerPath -Encoding UTF8
  Write-Host "Added record $id (Discogs release $releaseId)."
 }
 Start-Sleep -Milliseconds 2600
 $verified=Read-Discogs "$base/folders/0/releases?per_page=100&page=1"
 $verified | ConvertTo-Json -Depth 30 | Set-Content (Join-Path $directory 'discogs-after-import.json') -Encoding UTF8
 Write-Host "Verified collection total: $($verified.pagination.items)."
}catch{
 Write-Host ('Stopped safely: '+$_.Exception.GetType().Name+' at line '+$_.InvocationInfo.ScriptLineNumber+'. Check ledger and remote collection before retrying.');exit 1
}finally{
 if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
 $headers=$null;$token.Dispose()
}

