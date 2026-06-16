# One-time Postgres MCP Pro install into local venv (Windows).
$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$venvPath = Join-Path $scriptDir "postgres-mcp-venv"
$requirements = Join-Path $scriptDir "postgres-mcp-requirements.txt"

Write-Host "Creating venv: $venvPath"
python -m venv $venvPath

$pip = Join-Path $venvPath "Scripts\pip.exe"
& $pip install --upgrade pip
& $pip install -r $requirements

Write-Host "Done. Restart Cursor and enable the postgres MCP server in Settings -> Tools & MCP."
