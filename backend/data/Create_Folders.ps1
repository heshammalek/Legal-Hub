# Create_Folders.ps1
# دا اسكربت لبناء ملفات فولدر الداتا كلها من الترمنال ومن داخل الداتا فولدر   # تأكد أنك داخل مجلد data ثم شغل:
#powershell -ExecutionPolicy Bypass -File Create_Folders.ps1



# Define Arab countries
$ArabCountries = @(
    "egypt", "saudi_arabia", "uae", "jordan", "lebanon", "syria", "iraq",
    "qatar", "kuwait", "bahrain", "oman", "yemen", "palestine", "libya",
    "tunisia", "algeria", "morocco", "mauritania", "sudan", "somalia",
    "djibouti", "comoros"
)

# Define main folders structure
$MainFolders = @(
    "01_constitutions",
    "02_decisions", 
    "03_reports",
    "04_laws",
    "05_judgments",
    "06_international_agreements",
    "07_legal_templates"
)

# Define subfolders for judgments only
$JudgmentsSubfolders = @(
    "cassation",
    "appeal", 
    "constitutional",
    "administrative",
    "military",
    "fatwas",
    "commissioners_reports"
)

# Base path - starting from current 'data' folder
$BasePath = "countries"

Write-Host "Starting folder creation from current directory" -ForegroundColor Cyan

# Create the folder structure
foreach ($country in $ArabCountries) {
    $countryPath = Join-Path $BasePath $country
    
    # Create main country folder
    New-Item -ItemType Directory -Path $countryPath -Force
    
    # Create main folders for each country
    foreach ($folder in $MainFolders) {
        $folderPath = Join-Path $countryPath $folder
        New-Item -ItemType Directory -Path $folderPath -Force
        
        Write-Host "Created: $folderPath" -ForegroundColor Gray
        
        # Create subfolders only for judgments
        if ($folder -eq "05_judgments") {
            foreach ($subfolder in $JudgmentsSubfolders) {
                $subfolderPath = Join-Path $folderPath $subfolder
                New-Item -ItemType Directory -Path $subfolderPath -Force
                Write-Host "Created subfolder: $subfolderPath" -ForegroundColor DarkGray
            }
        }
    }
    
    Write-Host "Completed: $country" -ForegroundColor Green
}

# Display summary
Write-Host "`nFOLDER CREATION SUMMARY:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$totalCountries = $ArabCountries.Count
$totalMainFolders = $MainFolders.Count
$totalJudgmentsSubfolders = $JudgmentsSubfolders.Count
$totalFolders = ($totalCountries * $totalMainFolders) + ($totalCountries * $totalJudgmentsSubfolders)

Write-Host "Current Location: $(Get-Location)" -ForegroundColor Yellow
Write-Host "Total Countries: $totalCountries" -ForegroundColor Yellow
Write-Host "Main Folders per Country: $totalMainFolders" -ForegroundColor Yellow
Write-Host "Judgments Subfolders: $totalJudgmentsSubfolders" -ForegroundColor Yellow
Write-Host "Total Folders Created: $totalFolders" -ForegroundColor Green

Write-Host "`nFolder structure completed successfully!" -ForegroundColor Green
Write-Host "All folders are ready for data collection." -ForegroundColor Green