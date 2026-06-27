<#
.SYNOPSIS
  Universal startup script for Windows (PowerShell).
  Starts PostgreSQL (Docker) + Next.js dev server with one command.
#>

$ErrorActionPreference = "Stop"

# --- Colors ---
$GREEN  = "Green"
$YELLOW = "Yellow"
$RED    = "Red"
$CYAN   = "Cyan"

function Write-Info  { $msg = "+ $args"; Write-Host $msg -ForegroundColor $GREEN }
function Write-Warn  { $msg = "! $args"; Write-Host $msg -ForegroundColor $YELLOW }
function Write-Error { $msg = "x $args"; Write-Host $msg -ForegroundColor $RED }
function Write-Step  { Write-Host "`n--- $args ---" -ForegroundColor $CYAN }

# --- Configuration ---
$NEXT_PORT      = if ($env:NEXT_PORT)      { $env:NEXT_PORT }      else { 3000 }
$PG_PORT        = if ($env:PG_PORT)        { $env:PG_PORT }        else { 5432 }
$PG_CONTAINER   = if ($env:PG_CONTAINER)   { $env:PG_CONTAINER }   else { "kppdf-postgres" }
$PG_USER        = if ($env:PG_USER)        { $env:PG_USER }        else { "kppdf" }
$PG_PASS        = if ($env:PG_PASS)        { $env:PG_PASS }        else { "kppdf123" }
$PG_DB          = if ($env:PG_DB)          { $env:PG_DB }          else { "kppdf" }
$WAIT_TIMEOUT   = 30

$PROJECT_DIR = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $PROJECT_DIR

# --- Step 0: Dependency check ---
Write-Step "CHECKING DEPENDENCIES"

try {
  $null = Get-Command docker -ErrorAction Stop
  Write-Info "Docker found"
} catch {
  Write-Error "Docker not found. Install Docker Desktop: https://docker.com"
  exit 1
}

try {
  $null = Get-Command node -ErrorAction Stop
  Write-Info "Node.js $(node -v)"
} catch {
  Write-Error "Node.js not installed"
  exit 1
}

# --- Step 1: Free ports ---
Write-Step "FREEING PORTS"

$KILL_PORT_JS = Join-Path $PROJECT_DIR "scripts/kill-port.mjs"
$msg = "Freeing PostgreSQL port ${PG_PORT}..."
Write-Info $msg
node $KILL_PORT_JS $PG_PORT
Start-Sleep 1

# --- Step 2: Docker ---
Write-Step "CHECKING DOCKER"

try {
  $null = docker info 2>&1 | Select-String "Server Version"
  Write-Info "Docker is running"
} catch {
  Write-Warn "Docker is not running. Trying to start Docker Desktop..."
  $dockerPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerPath) {
    Start-Process -FilePath $dockerPath
    Write-Info "Docker Desktop starting. Waiting 15 seconds..."
    Start-Sleep 15
    try {
      $null = docker info 2>&1 | Select-String "Server Version"
      Write-Info "Docker is running"
    } catch {
      Write-Error "Docker did not start after auto-launch attempt."
      Write-Error "Start Docker Desktop manually and try again."
      exit 1
    }
  } else {
    Write-Error "Docker Desktop not found. Install from: https://docker.com"
    exit 1
  }
}

# --- Step 3: PostgreSQL container ---
Write-Step "STARTING POSTGRESQL"

$containerExists = docker ps -a --format "{{.Names}}" | Select-String "^$PG_CONTAINER$"
$containerRunning = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $PG_CONTAINER }

if ($containerRunning) {
  $msg = "Container $PG_CONTAINER already running"
  Write-Info $msg
} elseif ($containerExists) {
  $msg = "Container $PG_CONTAINER exists but stopped. Starting..."
  Write-Warn $msg
  docker start $PG_CONTAINER
  $msg = "Container $PG_CONTAINER started"
  Write-Info $msg
} else {
  $msg = "Creating container $PG_CONTAINER..."
  Write-Info $msg
  docker run -d `
    --name $PG_CONTAINER `
    -e POSTGRES_USER=$PG_USER `
    -e POSTGRES_PASSWORD=$PG_PASS `
    -e POSTGRES_DB=$PG_DB `
    -p "${PG_PORT}:5432" `
    postgres:16-alpine
  $msg = "Container $PG_CONTAINER created and started"
  Write-Info $msg
}

# Wait for PostgreSQL readiness
Write-Info "Waiting for PostgreSQL (up to ${WAIT_TIMEOUT}s)..."
$ready = $false
for ($i = 1; $i -le $WAIT_TIMEOUT; $i++) {
  try {
    $result = docker exec $PG_CONTAINER pg_isready -U $PG_USER 2>$null
    if ($result -and $result -match "accepting connections") {
      $ready = $true
      break
    }
  } catch { }
  Start-Sleep 1
}

if (-not $ready) {
  $msg = "PostgreSQL did not start within ${WAIT_TIMEOUT}s"
  Write-Error $msg
  exit 1
}
Write-Info "PostgreSQL is ready"

# --- Step 4: .env ---
Write-Step "CHECKING .ENV"

$envFile = ".env"
if (-not (Test-Path $envFile)) {
  Write-Warn ".env not found. Creating template..."
  $envTemplate = @"
DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@localhost:${PG_PORT}/${PG_DB}?sslmode=disable"
JWT_SECRET="dev-secret-change-me"
"@
  Out-File -FilePath $envFile -Encoding utf8 -InputObject $envTemplate
  Write-Info ".env created. JWT_SECRET='dev-secret-change-me' - replace for production!"
}

# Load .env (manual parsing, no regex, no brackets)
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line) { return }
  if ($line.StartsWith('#')) { return }
  if ($line.StartsWith(';')) { return }
  $eqPos = $line.IndexOf('=')
  if ($eqPos -le 0) { return }
  $name = $line.Substring(0, $eqPos).Trim()
  $value = $line.Substring($eqPos + 1).Trim()
  if ($value.Length -ge 2) {
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
  }
  Set-Item -Path "env:$name" -Value $value
}

$dbUrl = $env:DATABASE_URL
if ($dbUrl) {
  if ($dbUrl.Length -gt 40) {
    $urlPreview = $dbUrl.Substring(0, 40) + "..."
  } else {
    $urlPreview = $dbUrl
  }
  Write-Info "DATABASE_URL loaded: $urlPreview"
} else {
  Write-Warn "DATABASE_URL not found in .env"
}

if ($env:JWT_SECRET) {
  Write-Info "JWT_SECRET: set"
} else {
  Write-Warn "JWT_SECRET not found in .env"
}

# --- Step 5: npm install ---
Write-Step "CHECKING NODE_MODULES"

if (-not (Test-Path "node_modules")) {
  Write-Warn "node_modules not found. Installing..."
  npm install
  Write-Info "npm install complete"
} else {
  Write-Info "node_modules found"
}

# --- Step 6: Start Next.js ---
Write-Step "STARTING NEXT.JS"

Write-Host "`n=========================================" -ForegroundColor $GREEN
Write-Host "  Dev environment ready!" -ForegroundColor $GREEN
Write-Host "  Next.js:   http://localhost:${NEXT_PORT}" -ForegroundColor $GREEN
Write-Host "  PostgreSQL: localhost:${PG_PORT} ($PG_USER/$PG_DB)" -ForegroundColor $GREEN
Write-Host "  Logs above - Ctrl+C to stop" -ForegroundColor $GREEN
Write-Host "  Stop DB: docker stop $PG_CONTAINER" -ForegroundColor $GREEN
Write-Host "=========================================" -ForegroundColor $GREEN
Write-Host ""

& node scripts/dev.mjs -p $NEXT_PORT
