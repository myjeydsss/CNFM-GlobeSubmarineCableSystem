# PowerShell script to fix Formik error handling in all Segment files

$basePath = "c:\Users\ivane\Documents\GitHub\cnfm\cnfm-submarine-cable-dashboard-main\src\content\environment\components"
$folders = @("RPLSeaUS", "RPLSJC", "RPLTGNIA")

foreach ($folder in $folders) {
    $folderPath = Join-Path $basePath $folder
    if (Test-Path $folderPath) {
        $files = Get-ChildItem -Path $folderPath -Filter "Segment*.tsx"
        
        foreach ($file in $files) {
            Write-Host "Processing: $($file.FullName)"
            
            $content = Get-Content -Path $file.FullName -Raw
            
            # Skip if already has the import
            if ($content -notmatch "getFormikErrorText") {
                # Add import
                $content = $content -replace (
                    "import \* as Yup from 'yup';\s*import Swal from 'sweetalert2';"
                ), (
                    "import * as Yup from 'yup';`nimport Swal from 'sweetalert2';`nimport { getFormikErrorText, hasFormikError } from '../../../../utils/formikHelpers';"
                )
                
                # Fix helperText errors
                $content = $content -replace (
                    "helperText=\{touched\.(\w+) && errors\.(\w+)\}"
                ), (
                    "helperText={hasFormikError(touched.`$1, errors.`$2) ? getFormikErrorText(errors.`$2) : ''}"
                )
                
                # Fix Typography errors
                $content = $content -replace (
                    "\{errors\.(\w+)\}"
                ), (
                    "{getFormikErrorText(errors.`$1)}"
                )
                
                Set-Content -Path $file.FullName -Value $content
                Write-Host "Fixed: $($file.FullName)"
            } else {
                Write-Host "Already fixed: $($file.FullName)"
            }
        }
    }
}
