# Postgres MCP Pro (crystaldba/postgres-mcp), restricted mode.
# Reads DATABASE_URL from project .env — no secrets in mcp.json.

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$envFile = Join-Path $projectRoot ".env"
$mcpExe = Join-Path $PSScriptRoot "postgres-mcp-venv\Scripts\postgres-mcp.exe"

if (-not (Test-Path $mcpExe)) {
    Write-Error "postgres-mcp not installed. Run: powershell -File .cursor/setup-postgres-mcp.ps1"
    exit 1
}

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            Set-Item -Path "env:$key" -Value $val
        }
    }
}

if (-not $env:DATABASE_URL) {
    Write-Error "DATABASE_URL is not set. Add it to .env in the project root."
    exit 1
}

& $mcpExe $env:DATABASE_URL --access-mode=restricted --transport=stdio
