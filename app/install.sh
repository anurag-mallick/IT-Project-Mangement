#!/bin/bash
# ============================================
#    HORIZON IT — Installation Wizard
# ============================================
set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   HORIZON IT — Installation Wizard (Online)${NC}"
echo -e "${BLUE}============================================${NC}"

# Detect OS
OS_TYPE="$(uname)"
DISTRO="Unknown"
if [[ "$OS_TYPE" == "Darwin" ]]; then DISTRO="macOS"; elif [[ "$OS_TYPE" == "Linux" ]]; then . /etc/os-release && DISTRO=$NAME; fi
echo -e "System: ${GREEN}$DISTRO${NC}"

# Prerequisite Checks
check_deps() {
    if ! command -v git &> /dev/null; then
        echo -e "Installing Git..."
        if [[ "$OS_TYPE" == "Darwin" ]]; then brew install git; else sudo apt-get update && sudo apt-get install -y git; fi
    fi
    if ! command -v node &> /dev/null; then
        echo -e "Installing Node.js..."
        if [[ "$OS_TYPE" == "Darwin" ]]; then brew install node@20; else curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; fi
    fi
}
check_deps

# Interactive Config
clear
echo -e "${BLUE}HORIZON IT Configuration${NC}\n"
read -p "Environment ([1] Local, [2] VM): " ENV_CHOICE
read -p "Database ([1] Docker, [2] Native): " DB_CHOICE
read -p "Roundcube Email: " EMAIL_ID
read -p "Email Password: " EMAIL_PW
read -p "IMAPS Port (993): " IMAP_PORT
IMAP_PORT=${IMAP_PORT:-993}
MAIL_HOST="mail.$(echo $EMAIL_ID | sed 's/.*@//')"

# Clone
if [ ! -f "package.json" ]; then
    git clone https://github.com/anurag-mallick/IT-Project-Management.git horizon-it
    cd horizon-it/app || exit
fi

# Secrets
JWT_SECRET=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 48 | head -n 1)
DB_PASSWORD=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 24 | head -n 1)
ADMIN_PASSWORD=$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 16 | head -n 1)

if [[ "$OS_TYPE" == "Darwin" ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo "localhost")
else
    LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "localhost")
fi

# Write .env
cat <<EOF > .env
DATABASE_URL=postgresql://horizon_user:$DB_PASSWORD@localhost:5432/horizon_it
JWT_SECRET=$JWT_SECRET
NEXT_PUBLIC_APP_URL=http://${LOCAL_IP}:3000
NODE_ENV=production
SMTP_HOST=$MAIL_HOST
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=$EMAIL_ID
SMTP_PASS=$EMAIL_PW
SMTP_FROM='IT Support <$EMAIL_ID>'
IMAP_HOST=$MAIL_HOST
IMAP_PORT=$IMAP_PORT
IMAP_USER=$EMAIL_ID
IMAP_PASS=$EMAIL_PW
IMAP_TICKET_FOLDER=INBOX
EOF

# Install & Build
npm install --production=false
npx prisma generate
npx prisma db push --accept-data-loss

ADMIN_PASS="$ADMIN_PASSWORD" node -e "
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

echo -e "\n${GREEN}Installation Complete!${NC}"
echo -e "URL: http://$LOCAL_IP:3000"
echo -e "Admin Email: admin@horizonit.local"
echo -e "Admin Password: $ADMIN_PASSWORD"
read -p "Press Enter to exit..."
