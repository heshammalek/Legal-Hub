# Add_Metadata_Folders_Fixed.ps1
# شغّل هذا الكود من داخل مجلد data

$countriesPath = "countries"

if (-not (Test-Path $countriesPath)) {
    Write-Host "Error: countries folder not found" -ForegroundColor Red
    exit
}

$countries = Get-ChildItem $countriesPath -Directory

foreach ($country in $countries) {
    $metadataPath = Join-Path $country.FullName "metadata"
    
    # إنشاء مجلد metadata
    New-Item -ItemType Directory -Path $metadataPath -Force | Out-Null
    
    # إنشاء ملف JSON للميتاداتا
    $metadataFile = Join-Path $metadataPath "documents_metadata.json"
    
    $metadataStructure = @{
        country = $country.Name
        created_date = Get-Date -Format "yyyy-MM-dd"
        total_documents = 0
        documents = @()
    }
    
    $metadataStructure | ConvertTo-Json -Depth 3 | Out-File -FilePath $metadataFile -Encoding utf8
    
    Write-Host "Created: $metadataFile" -ForegroundColor Green
}

Write-Host "Done! Created metadata folders for all countries" -ForegroundColor Cyan