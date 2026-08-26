function Resolve-Includes {
    param (
        [string]$Content
    )
    $pattern = "<\?!=\s*include\s*\('([^']+)'\)\s*\?>"
    
    # Define MatchEvaluator scriptblock
    $evaluator = {
        param($match)
        $fileName = $match.Groups[1].Value
        
        $path1 = [System.IO.Path]::Combine($PSScriptRoot, "$fileName.html")
        $path2 = [System.IO.Path]::Combine($PSScriptRoot, "backend", "$fileName.html")
        
        $fileContent = ""
        if ([System.IO.File]::Exists($path1)) {
            $fileContent = [System.IO.File]::ReadAllText($path1, [System.Text.Encoding]::UTF8)
        } elseif ([System.IO.File]::Exists($path2)) {
            $fileContent = [System.IO.File]::ReadAllText($path2, [System.Text.Encoding]::UTF8)
        } else {
            return "<!-- MISSING INCLUDE: $fileName -->"
        }
        
        # Recursively resolve includes inside the included content
        return Resolve-Includes -Content $fileContent
    }
    
    return [regex]::Replace($Content, $pattern, $evaluator)
}

$appHtmlPath = [System.IO.Path]::Combine($PSScriptRoot, "app.html")
if ([System.IO.File]::Exists($appHtmlPath)) {
    $appHtml = [System.IO.File]::ReadAllText($appHtmlPath, [System.Text.Encoding]::UTF8)
    $appHtml = $appHtml -replace "<\?=\s*activePage\s*\?>", "donvitinh"
    
    $bundled = Resolve-Includes -Content $appHtml
    $distPath = [System.IO.Path]::Combine($PSScriptRoot, "dist_app.html")
    [System.IO.File]::WriteAllText($distPath, $bundled, [System.Text.Encoding]::UTF8)
    Write-Host "Successfully bundled dist_app.html via PowerShell MatchEvaluator!"
} else {
    Write-Error "app.html not found!"
}
