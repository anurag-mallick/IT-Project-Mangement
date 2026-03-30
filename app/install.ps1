# ============================================
#    HORIZON IT — Installation Wizard
# ============================================

# Step A: Check prerequisites
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Red
    exit 1
}

# Check Git
try {
    git --version | Out-Null
} catch {
    Write-Host "Git is not installed. Attempting to install..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "Downloading Git installer..."
        $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe"
        $gitInstaller = "$env:TEMP\git-setup.exe"
        Invoke-WebRequest -Uri $gitUrl -OutFile $gitInstaller -UseBasicParsing
        Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT /NORESTART" -Wait
    }
    $env:PATH += ";C:\Program Files\Git\bin;C:\Program Files\Git\cmd"
}

# Check Node.js 18+
$installNode = $false
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v', '' -replace '\..*', '')
    if ($majorVersion -lt 18) {
        Write-Host "Node.js 18+ is required. Found $nodeVersion. Updating..." -ForegroundColor Yellow
        $installNode = $true
    }
} catch {
    Write-Host "Node.js is not installed. Attempting to install..." -ForegroundColor Yellow
    $installNode = $true
}

if ($installNode) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "Downloading Node.js installer..."
        $nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
        $nodeInstaller = "$env:TEMP\node-setup.msi"
        Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller -UseBasicParsing
        Start-Process -FilePath msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait
    }
    $env:PATH += ";C:\Program Files\nodejs"
}

# Step B: Interactive Configuration
Clear-Host
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   HORIZON IT — Installation Wizard (Online Version)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Environment Selection
Write-Host "Choose your deployment environment:"
Write-Host "  [1] Local System — Optimized for personal desktop/laptop."
Write-Host "  [2] Virtual Machine / Server — Optimized for shared network access."
$env_choice = ""
while ($env_choice -notmatch "^[12]$") {
    $env_choice = Read-Host "Enter choice (1 or 2)"
}

# 2. Database Selection
Write-Host "`nChoose your database method:"
Write-Host "  [1] Docker — Recommended. Requires Docker Desktop."
Write-Host "  [2] Native — No Docker needed. Installs PostgreSQL directly."
$db_choice = ""
while ($db_choice -notmatch "^[12]$") {
    $db_choice = Read-Host "Enter choice (1 or 2)"
}

# 3. Roundcube Integration
Write-Host "`nConfigure Roundcube Email Integration:"
$EMAIL_ID = Read-Host "Enter Roundcube Email (e.g., support@domain.in)"
$EMAIL_PW = Read-Host "Enter Email Password"
$IMAP_PORT = Read-Host "Enter IMAPS Port (default 993)"
if (-not $IMAP_PORT) { $IMAP_PORT = "993" }

# Extract host from email
$MAIL_HOST = "mail." + ($EMAIL_ID -replace '.*@', '')

# Step C: Clone the repo (if not already in the repo directory)
if (-not (Test-Path ".\package.json")) {
    Write-Host "Cloning repository..."
    git clone https://github.com/anurag-mallick/IT-Project-Management.git horizon-it
    Set-Location horizon-it\app
}

# Step D: Generate secrets
Write-Host "Generating secure random keys..."
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | % {[char]$_})
$DB_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | % {[char]$_})
$ADMIN_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | % {[char]$_})

# Step E: Detect the machine's local network IP
$LOCAL_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
if (-not $LOCAL_IP) { $LOCAL_IP = "localhost" }

# Step F: Define Installation Functions

function Install-Docker {
    Write-Host "Starting Docker installation..." -ForegroundColor Yellow
    try {
        docker info >$null 2>&1
    } catch {
        Write-Host "Docker Desktop is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }

    @"
POSTGRES_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_APP_URL=http://${LOCAL_IP}:3000
NODE_ENV=production

# Email Configuration (SMTP - Outgoing)
SMTP_HOST=$MAIL_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$EMAIL_ID
SMTP_PASS=$EMAIL_PW
SMTP_FROM='IT Support <$EMAIL_ID>'

# Email Configuration (IMAP - Incoming)
IMAP_HOST=$MAIL_HOST
IMAP_PORT=$IMAP_PORT
IMAP_USER=$EMAIL_ID
IMAP_PASS=$EMAIL_PW
IMAP_TICKET_FOLDER=INBOX
"@ | Set-Content .env

    Write-Host "Building containers..."
    docker-compose down --remove-orphans 2>$null
    docker-compose up -d --build

    Write-Host "Waiting for database to be ready..."
    $maxWait = 60
    $waited = 0
    do {
        Start-Sleep -Seconds 3
        $waited += 3
        $healthy = docker-compose ps db | Select-String "healthy"
    } while (-not $healthy -and $waited -lt $maxWait)

    docker-compose exec -T app npx prisma db push --accept-data-loss

    # Seed admin user
    $env:ADMIN_PASS = $ADMIN_PASSWORD
    docker-compose exec -T -e ADMIN_PASS app node -e "
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hashed = await bcrypt.hash(process.env.ADMIN_PASS, 10);
  await prisma.user.upsert({
    where: { email: 'admin@horizonit.local' },
    update: { password: hashed },
    create: {
      email: 'admin@horizonit.local',
      username: 'admin',
      name: 'Administrator',
      role: 'ADMIN',
      password: hashed,
      isActive: true
    }
  });
  console.log('Admin user ready.');
  await prisma.\$disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
"
    Write-Host "Docker installation complete." -ForegroundColor Green
}

function Install-Native {
    Write-Host "Starting Native installation..." -ForegroundColor Yellow
    $pgPath = Get-Command psql -ErrorAction SilentlyContinue
    if (-not $pgPath) {
        Write-Host "Installing PostgreSQL 16..."
        $pgInstaller = "$env:TEMP\postgresql-installer.exe"
        $pgUrl = "https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64.exe"
        Invoke-WebRequest -Uri $pgUrl -OutFile $pgInstaller -UseBasicParsing
        Start-Process -FilePath $pgInstaller -ArgumentList @(
            "--mode", "unattended", "--servicename", "postgresql-16",
            "--servicepassword", $DB_PASSWORD, "--superpassword", $DB_PASSWORD,
            "--enable-components", "server,commandlinetools"
        ) -Wait
        $env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
    }

    $env:PGPASSWORD = $DB_PASSWORD
    $psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    & $psqlPath -U postgres -c "CREATE DATABASE horizon_it;" 2>$null
    & $psqlPath -U postgres -c "CREATE USER horizon_user WITH PASSWORD '$DB_PASSWORD';" 2>$null
    & $psqlPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE horizon_it TO horizon_user;" 2>$null
    & $psqlPath -U postgres -c "ALTER DATABASE horizon_it OWNER TO horizon_user;" 2>$null

    @"
DATABASE_URL=postgresql://horizon_user:$DB_PASSWORD@localhost:5432/horizon_it
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_APP_URL=http://${LOCAL_IP}:3000
NODE_ENV=production

# Email Configuration (SMTP - Outgoing)
SMTP_HOST=$MAIL_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$EMAIL_ID
SMTP_PASS=$EMAIL_PW
SMTP_FROM='IT Support <$EMAIL_ID>'

# Email Configuration (IMAP - Incoming)
IMAP_HOST=$MAIL_HOST
IMAP_PORT=$IMAP_PORT
IMAP_USER=$EMAIL_ID
IMAP_PASS=$EMAIL_PW
IMAP_TICKET_FOLDER=INBOX
"@ | Set-Content .env

    npm install --production=false
    npx prisma generate
    npx prisma db push --accept-data-loss

    $env:ADMIN_PASS = $ADMIN_PASSWORD
    node -e "
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hashed = await bcrypt.hash(process.env.ADMIN_PASS, 10);
  await prisma.user.upsert({
    where: { email: 'admin@horizonit.local' },
    update: { password: hashed },
    create: {
      email: 'admin@horizonit.local',
      username: 'admin',
      name: 'Administrator',
      role: 'ADMIN',
      password: hashed,
      isActive: true
    }
  });
  console.log('Admin user ready.');
  await prisma.\$disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
"
    npm run build
    Write-Host "Native installation complete." -ForegroundColor Green
}

if ($db_choice -eq "1") {
    Install-Docker
    $mode = "Docker"
} else {
    Install-Native
    $mode = "Native"
}

$infoContent = @"
ACCESS DETAILS:
URL          : http://$($LOCAL_IP):3000
Admin Email  : admin@horizonit.local
Admin Password: $ADMIN_PASSWORD
"@
$infoContent | Set-Content INSTALL_INFO.txt
Write-Host "`nInstallation Details saved to INSTALL_INFO.txt"
Read-Host "Press Enter to exit..."
