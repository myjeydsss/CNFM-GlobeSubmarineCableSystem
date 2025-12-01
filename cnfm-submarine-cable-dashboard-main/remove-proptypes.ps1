# PowerShell script to remove PropTypes from TypeScript component files

$files = @(
    "src\components\Label\index.tsx",
    "src\components\PageTitleWrapper\index.tsx", 
    "src\components\Scrollbar\index.tsx",
    "src\components\Text\index.tsx"
)

foreach ($file in $files) {
    $fullPath = "c:\Users\ivane\Documents\GitHub\cnfm\cnfm-submarine-cable-dashboard-main\$file"
    if (Test-Path $fullPath) {
        Write-Host "Processing: $fullPath"
        
        $content = Get-Content -Path $fullPath -Raw
        
        # Remove PropTypes import if it's the only PropTypes usage
        $content = $content -replace "import PropTypes from 'prop-types';\s*", ""
        
        # Remove PropTypes declarations (everything from ComponentName.propTypes = { to the closing }; )
        $content = $content -replace "(?s)\w+\.propTypes\s*=\s*\{[^}]*\};\s*", ""
        
        Set-Content -Path $fullPath -Value $content
        Write-Host "Removed PropTypes from: $fullPath"
    }
}
