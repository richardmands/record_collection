param([string]$QueriesFile='')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$directory=Join-Path $root '.work'
$token=(Get-Content (Join-Path $directory 'discogs-token.dpapi') -Raw).Trim() | ConvertTo-SecureString
$pointer=[IntPtr]::Zero
try {
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
 $headers=@{Authorization=('Discogs token='+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim());'User-Agent'='RichardsRecords/1.0 +https://richardsrecords.netlify.app/'}
 $catalogue=Get-Content (Join-Path $root 'public/data/collection.json') -Raw -Encoding UTF8 | ConvertFrom-Json
 $cache=Join-Path $directory $(if($QueriesFile){'discogs-search-deep'}else{'discogs-search'});New-Item -ItemType Directory -Force $cache | Out-Null
 if($QueriesFile){$queries=Get-Content $QueriesFile -Raw -Encoding UTF8|ConvertFrom-Json}
 foreach($album in $catalogue.albums){
  $path=Join-Path $cache ($album.id+'.json');if(Test-Path $path){continue}
  if($QueriesFile -and -not $queries.($album.id)){continue}
  if(-not $QueriesFile -and $album.discogsUrl -match '/release/\d+'){continue}
  $title=$album.titleJa;if(-not $title){$title=$album.titleEn}
  $artist=$album.artistJa;if(-not $artist -or $artist -eq 'Various Artists'){$artist=$album.artistEn}
  if($artist -eq 'Various Artists'){$artist=''}
  if($album.catalogNumber){$query='catno='+[Uri]::EscapeDataString($album.catalogNumber)}else{$query='q='+[Uri]::EscapeDataString(($artist+' '+$title).Trim())}
  if($QueriesFile){$query='q='+[Uri]::EscapeDataString($queries.($album.id))}
  $url='https://api.discogs.com/database/search?type=release&format=Vinyl&per_page=15&'+$query
  Start-Sleep -Milliseconds 2600
  $response=Invoke-WebRequest -UseBasicParsing -Uri $url -Headers $headers -TimeoutSec 30
  $json=[Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
  [IO.File]::WriteAllText($path,$json,[Text.Encoding]::UTF8)
  $result=$json|ConvertFrom-Json
  Write-Host "Record $($album.id): $($result.pagination.items) candidates"
 }
}catch{Write-Host ('Search stopped: '+$_.Exception.GetType().Name+'. Saved results are retained.');exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)};$headers=$null;$token.Dispose()}

