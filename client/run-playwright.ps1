# Set HOME environment variable for Playwright
$env:HOME = $env:USERPROFILE
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:USERPROFILE\.cache\ms-playwright"

Write-Host "HOME set to: $env:HOME"
Write-Host "PLAYWRIGHT_BROWSERS_PATH set to: $env:PLAYWRIGHT_BROWSERS_PATH"

# Run Playwright test
npx playwright test $args
