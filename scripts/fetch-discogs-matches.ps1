$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$directory=Join-Path $root '.work'
$token=(Get-Content (Join-Path $directory 'discogs-token.dpapi') -Raw).Trim() | ConvertTo-SecureString
$pointer=[IntPtr]::Zero
try {
 $pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
 $headers=@{Authorization=('Discogs token='+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim());'User-Agent'='RichardsRecords/1.0 +https://richardsrecords.netlify.app/'}
 $matches=Get-Content (Join-Path $root 'data/research/discogs-matches.json') -Raw -Encoding UTF8|ConvertFrom-Json
 $cache=Join-Path $directory 'discogs-releases';New-Item -ItemType Directory -Force $cache|Out-Null
 foreach($releaseId in @($matches.psobject.Properties.Value | Sort-Object -Unique)){
  $path=Join-Path $cache ($releaseId.ToString()+'.json');if(Test-Path $path){continue}
  Start-Sleep -Milliseconds 1200
  $response=Invoke-WebRequest -UseBasicParsing -Uri "https://api.discogs.com/releases/$releaseId" -Headers $headers -TimeoutSec 30
  [IO.File]::WriteAllText($path,[Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()),[Text.Encoding]::UTF8)
  Write-Host "Fetched release $releaseId"
 }
}catch{Write-Host ('Fetch stopped: '+$_.Exception.GetType().Name);exit 1}
finally{if($pointer -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)};$headers=$null;$token.Dispose()}
