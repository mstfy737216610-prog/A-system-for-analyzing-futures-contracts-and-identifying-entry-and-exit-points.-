#!/data/data/com.termux/files/usr/bin/bash
set -e

echo "============================================================"
echo "  Avantis Cyber-Quant & Freqtrade Terminal - Termux Setup"
echo "============================================================"

echo "[1/6] تحديث حزم Termux..."
pkg update -y && pkg upgrade -y

echo "[2/6] تثبيت Node.js و Git و Python وأدوات البناء..."
pkg install -y nodejs-lts git python curl openssl unzip

echo "[3/6] تجهيز صلاحية التخزين ومجلد الذاكرة في التنزيلات..."
if [ ! -d "$HOME/storage/downloads" ]; then
  termux-setup-storage || true
fi

SYNC_DIR="/sdcard/Download/AvantisCryptoMemory"
if [ ! -w "/sdcard/Download" ] && [ -d "$HOME/storage/downloads" ]; then
  SYNC_DIR="$HOME/storage/downloads/AvantisCryptoMemory"
fi
mkdir -p "$SYNC_DIR/coins" || mkdir -p "./downloads_sync/AvantisCryptoMemory/coins"

echo "[4/6] تجهيز ملف الإعدادات .env..."
if [ ! -f ".env" ]; then
  cat << EOF > .env
AGNES_BASE_URL="https://apihub.agnes-ai.com/v1"
AGNES_API_KEY="sk-ctBztqbDFE41jH76EcqX1Xgn6zFk0l9AJieBufBfWEUR3vBR"
AVANTIS_SYNC_DIR="$SYNC_DIR"
PORT=3000
EOF
fi

echo "[5/6] تثبيت مكتبات المشروع (npm install)..."
npm install --no-audit --no-fund

echo "[6/6] تشغيل المنصة على المنفذ 3000..."
echo "افتح المتصفح على: http://localhost:3000"
echo "مجلد المزامنة الدائم: $SYNC_DIR"
termux-wake-lock || true
npm run dev
