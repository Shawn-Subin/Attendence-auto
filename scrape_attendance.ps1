# MITS ETLAB Attendance Scraper
# Automates login and updates MITS Campus Hub with live ETLAB data

[CmdletBinding()]
param(
    [string]$Username = $(if ($env:ETLAB_USERNAME) { $env:ETLAB_USERNAME } else { "25CT256" }),
    [string]$Password = $(if ($env:ETLAB_PASSWORD) { $env:ETLAB_PASSWORD } else { 'Shawn@2007' }),
    [string]$LoginUrl = "https://mits.etlab.app/user/login",
    [string]$TargetUrl = "https://mits.etlab.app/ktuacademics/student/viewattendancesubject/46380601013",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

# Ensure UTF-8 output encoding for terminal
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Render-ProgressStep {
    param(
        [int]$Percent,
        [string]$Step,
        [string]$Detail
    )
    $barLength = 30
    $filledLength = [math]::Floor(($Percent / 100) * $barLength)
    $emptyLength = $barLength - $filledLength
    
    $filled = "=" * $filledLength
    $empty = "-" * $emptyLength
    
    Write-Host ""
    Write-Host ("  [{0}] {1}" -f $Step, $Detail) -ForegroundColor White
    Write-Host -NoNewline "  [" -ForegroundColor DarkGray
    Write-Host -NoNewline "$filled" -ForegroundColor Green
    Write-Host -NoNewline ">" -ForegroundColor Yellow
    Write-Host -NoNewline "$empty" -ForegroundColor DarkGray
    Write-Host (" ] {0,3}%" -f $Percent) -ForegroundColor Yellow
    
    try {
        if ($host -and $host.UI -and $host.UI.RawUI) {
            $host.UI.RawUI.WindowTitle = "MITS Campus Hub: $Percent% - $Detail"
        }
    } catch {}
    Start-Sleep -Milliseconds 60
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "         MITS Campus Hub - Live ETLAB Attendance Sync           " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

try {
    # ----------------------------------------------------
    # 1. Initialize Web Session
    # ----------------------------------------------------
    Render-ProgressStep -Percent 15 -Step "1/5" -Detail "Connecting to ETLAB login portal..."
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
    $userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    $loginPage = Invoke-WebRequest -Uri $LoginUrl -WebSession $session -UseBasicParsing -UserAgent $userAgent

    # Extract CSRF token
    $csrfToken = ""
    $pattern1 = 'YII_CSRF_TOKEN":\s*"([^"]+)"'
    $pattern2 = 'name="YII_CSRF_TOKEN"\s+value="([^"]+)"'

    if ($loginPage.Content -match $pattern1) {
        $csrfToken = $matches[1]
    } elseif ($loginPage.Content -match $pattern2) {
        $csrfToken = $matches[1]
    }

    if ($csrfToken) {
        Render-ProgressStep -Percent 30 -Step "1/5" -Detail "CSRF Security Token Verified"
    } else {
        Write-Warning "CSRF token not found in page. Proceeding without it..."
    }

    # ----------------------------------------------------
    # 2. Authenticate
    # ----------------------------------------------------
    Render-ProgressStep -Percent 45 -Step "2/5" -Detail "Authenticating as $Username (Shawn Subin Philip)..."
    $postBody = @{
        "LoginForm[username]" = $Username
        "LoginForm[password]" = $Password
        "yt0" = "Login"
    }
    if ($csrfToken) {
        $postBody["YII_CSRF_TOKEN"] = $csrfToken
    }

    $loginResponse = Invoke-WebRequest -Uri $LoginUrl -Method Post -Body $postBody -WebSession $session -UseBasicParsing -UserAgent $userAgent

    # Verify authentication success
    $isLoggedIn = $false
    if ($loginResponse.Content -match 'Logout' -or $loginResponse.Content -match 'SHAWN' -or $loginResponse.Content -match 'student/profile') {
        $isLoggedIn = $true
    }

    if (-not $isLoggedIn) {
        if ($loginResponse.Content -match '<div class="flash-error">([^<]+)</div>') {
            throw "Login failed: $($matches[1].Trim())"
        }
        if ($loginResponse.Content -match 'Incorrect username or password') {
            throw "Login failed: Incorrect username or password."
        }
    }
    Render-ProgressStep -Percent 60 -Step "2/5" -Detail "Authentication Successful!"

    # ----------------------------------------------------
    # 3. Fetch Attendance Page
    # ----------------------------------------------------
    Render-ProgressStep -Percent 75 -Step "3/5" -Detail "Fetching S3 CS AI subject-wise attendance records..."
    $attResponse = Invoke-WebRequest -Uri $TargetUrl -WebSession $session -UseBasicParsing -UserAgent $userAgent
    $attHtml = $attResponse.Content

    if ($attHtml -notmatch '<table class="items table') {
        throw "Could not find attendance table on page. Session may have expired."
    }

    # ----------------------------------------------------
    # 4. Parse Attendance Table
    # ----------------------------------------------------
    Render-ProgressStep -Percent 85 -Step "4/5" -Detail "Parsing courses, percentages, and bunk limits..."

    # Extract table block
    $tableRegex = '(?s)<table class="items table[^>]*>(.*?)</table>'
    if ($attHtml -notmatch $tableRegex) {
        throw "Failed to match table HTML."
    }
    $tableHtml = $matches[1]

    # Extract header columns
    $headerCols = @()
    $thRegex = '(?s)<th[^>]*>(.*?)</th>'
    $thMatches = [regex]::Matches($tableHtml, $thRegex)
    foreach ($m in $thMatches) {
        $raw = $m.Groups[1].Value -replace '<[^>]+>', ''
        $clean = ($raw -replace '\s+', ' ').Trim()
        $headerCols += $clean
    }

    # Extract body row cells
    $bodyCells = @()
    $tbodyRegex = '(?s)<tbody>\s*<tr>(.*?)</tr>\s*</tbody>'
    if ($tableHtml -match $tbodyRegex) {
        $rowHtml = $matches[1]
        $tdRegex = '(?s)<td[^>]*>(.*?)</td>'
        $tdMatches = [regex]::Matches($rowHtml, $tdRegex)
        foreach ($m in $tdMatches) {
            $raw = $m.Groups[1].Value -replace '<[^>]+>', ''
            $clean = ($raw -replace '\s+', ' ').Trim()
            $bodyCells += $clean
        }
    }

    if ($headerCols.Count -eq 0 -or $bodyCells.Count -eq 0) {
        throw "Failed to extract table headers or row data from ETLAB table."
    }

    # Extract student metadata
    $regNo = if ($bodyCells.Count -gt 0) { $bodyCells[0] } else { "MITS25UCA065" }
    $rollNo = if ($bodyCells.Count -gt 1) { $bodyCells[1] } else { "65" }
    $studentName = if ($bodyCells.Count -gt 2) { $bodyCells[2] } else { "SHAWN SUBIN PHILIP" }

    # Extract subjects
    $parsedSubjects = @()
    $totalAttended = 0
    $totalHeld = 0

    for ($i = 3; $i -lt $headerCols.Count; $i++) {
        $colName = $headerCols[$i]
        if ($colName -eq "Total" -or $colName -eq "Percentage") {
            continue
        }

        if ($i -lt $bodyCells.Count) {
            $cellValue = $bodyCells[$i]
            $valPattern = '(\d+)\s*/\s*(\d+)\s*(?:\((\d+(?:\.\d+)?)%\))?'
            if ($cellValue -match $valPattern) {
                $att = [int]$matches[1]
                $hld = [int]$matches[2]
                $pct = if ($matches[3]) { [double]$matches[3] } else { if ($hld -gt 0) { [math]::Round(($att / $hld) * 100, 1) } else { 100.0 } }

                # Determine pure code from colName, e.g. "B250802/CN310B" -> "CN310B"
                $pureCode = $colName
                if ($colName -match '/([A-Za-z0-9_]+)$') {
                    $pureCode = $matches[1]
                }

                # Calculate bunks till < 90% (Tier 1) and < 75% (Tier 2)
                $bunk90 = [math]::Floor((10 * $att - 9 * $hld) / 9)
                $bunk75 = [math]::Floor((4 * $att - 3 * $hld) / 3)
                $needed90 = [math]::Max(1, (9 * $hld - 10 * $att))
                $needed75 = [math]::Max(1, (3 * $hld - 4 * $att))

                $parsedSubjects += [PSCustomObject]@{
                    CourseId = $colName
                    Code = $pureCode
                    Attended = $att
                    Held = $hld
                    Percentage = $pct
                    BunkTill90 = [math]::Max(0, $bunk90)
                    BunkTill75 = [math]::Max(0, $bunk75)
                    NeededFor90 = $needed90
                    NeededFor75 = $needed75
                }

                $totalAttended += $att
                $totalHeld += $hld
            }
        }
    }

    $overallPct = if ($totalHeld -gt 0) { [math]::Round(($totalAttended / $totalHeld) * 100, 1) } else { 100.0 }
    $overallBunk90 = [math]::Floor((10 * $totalAttended - 9 * $totalHeld) / 9)
    $overallBunk75 = [math]::Floor((4 * $totalAttended - 3 * $totalHeld) / 3)

    # ----------------------------------------------------
    # 5. Save Data and Update Files
    # ----------------------------------------------------
    Render-ProgressStep -Percent 95 -Step "5/5" -Detail "Syncing local database and cache..."

    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $scrapedPayload = [PSCustomObject]@{
        Timestamp = $timestamp
        Student = [PSCustomObject]@{
            Name = $studentName
            RollNo = $rollNo
            RegNo = $regNo
        }
        Overall = [PSCustomObject]@{
            TotalAttended = $totalAttended
            TotalHeld = $totalHeld
            Percentage = $overallPct
            BunkTill90 = $overallBunk90
            BunkTill75 = $overallBunk75
        }
        Subjects = $parsedSubjects
    }

    # Save JSON file
    $jsonPath = Join-Path $scriptDir "attendance_scraped.json"
    $scrapedPayload | ConvertTo-Json -Depth 5 | Out-File -FilePath $jsonPath -Encoding ASCII

    # Update src/data/defaultData.js safely
    $defaultDataPath = Join-Path $scriptDir "src\data\defaultData.js"
    if (Test-Path $defaultDataPath) {
        $defDataContent = [System.IO.File]::ReadAllText($defaultDataPath, [System.Text.Encoding]::UTF8)

        foreach ($s in $parsedSubjects) {
            $escCode = [regex]::Escape($s.Code)
            $blockPattern = "(?s)(\{\s*id:[^}]+code:\s*['""]" + $escCode + "['""][^}]+?\})"
            if ($defDataContent -match $blockPattern) {
                $oldBlock = $matches[1]
                $newBlock = $oldBlock -replace 'attended:\s*\d+', "attended: $($s.Attended)"
                $newBlock = $newBlock -replace 'held:\s*\d+', "held: $($s.Held)"
                $defDataContent = $defDataContent.Replace($oldBlock, $newBlock)
            }
        }

        $newKey = "mits_s3_cs_ai_shawn_v" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $defDataContent = [regex]::Replace($defDataContent, "ATTENDANCE_STORAGE_KEY\s*=\s*['""][^'""]+['""]", "ATTENDANCE_STORAGE_KEY = '$newKey'")

        $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($defaultDataPath, $defDataContent, $utf8WithoutBom)
    }

    # Update index.html safely
    $indexPath = Join-Path $scriptDir "index.html"
    if (Test-Path $indexPath) {
        $indexContent = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

        foreach ($s in $parsedSubjects) {
            $escCode = [regex]::Escape($s.Code)
            $blockPattern = "(?s)(\{\s*id:[^}]+code:\s*['""]" + $escCode + "['""][^}]+?\})"
            if ($indexContent -match $blockPattern) {
                $oldBlock = $matches[1]
                $newBlock = $oldBlock -replace 'attended:\s*\d+', "attended: $($s.Attended)"
                $newBlock = $newBlock -replace 'held:\s*\d+', "held: $($s.Held)"
                $indexContent = $indexContent.Replace($oldBlock, $newBlock)
            }
        }

        $newKey = "mits_s3_cs_ai_shawn_v" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
        $indexContent = [regex]::Replace($indexContent, "(SUBJECTS|ATTENDANCE):\s*['""][^'""]+['""]", "SUBJECTS: '$newKey'")

        $utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($indexPath, $indexContent, $utf8WithoutBom)
    }

    Render-ProgressStep -Percent 100 -Step "DONE" -Detail "Sync Complete! Launching MITS Campus Hub..."
    Write-Host ""
    Write-Host "=================================================================================" -ForegroundColor DarkGray
    Write-Host ("{0,-10} | {1,-10} | {2,-6} | {3,-12} | {4}" -f "COURSE", "ATTENDED", "PCT", "STATUS", "BUNK ADVICE") -ForegroundColor White
    Write-Host "---------------------------------------------------------------------------------" -ForegroundColor DarkGray

    foreach ($sub in $parsedSubjects) {
        $statusText = if ($sub.Percentage -ge 90) { "5 Marks Safe" } elseif ($sub.Percentage -ge 75) { "Eligible 75%" } else { "Shortage" }
        $adviceText = ""
        if ($sub.Percentage -ge 90) {
            if ($sub.BunkTill90 -gt 0) {
                $adviceText = "Can bunk $($sub.BunkTill90) class(es) till <90%"
            } else {
                $adviceText = "Edge: Missing next class drops <90%"
            }
        } elseif ($sub.Percentage -ge 75) {
            $adviceText = "Can bunk $($sub.BunkTill75) class(es) till <75%"
        } else {
            $adviceText = "Must attend next $($sub.NeededFor75) class(es)"
        }

        $color = if ($sub.Percentage -ge 90) { "Yellow" } elseif ($sub.Percentage -ge 75) { "Green" } else { "Red" }
        Write-Host ("{0,-10} | {1,4}/{2,-4}  | {3,5}% | {4,-12} | {5}" -f $sub.Code, $sub.Attended, $sub.Held, $sub.Percentage, $statusText, $adviceText) -ForegroundColor $color
    }

    Write-Host "---------------------------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ("{0,-10} | {1,4}/{2,-4}  | {3,5}% | {4,-12} | Overall bunk till <90%: {5} classes" -f "TOTAL", $totalAttended, $totalHeld, $overallPct, "5 Marks Safe", $overallBunk90) -ForegroundColor Cyan
    Write-Host "=================================================================================" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Student: $studentName (Roll #$rollNo | $regNo)" -ForegroundColor Yellow
    Write-Host "Last Synced: $timestamp" -ForegroundColor DarkGray
    Write-Host ""

    # Open index.html in default browser if not suppressed and not in CI
    if (-not $NoBrowser -and -not $env:CI -and -not $env:GITHUB_ACTIONS) {
        Start-Process $indexPath
    }

} catch {
    Write-Host ""
    Write-Host "[ERROR] Scraping failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
