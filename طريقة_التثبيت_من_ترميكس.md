# 📱 الدليل الكامل: طريقة التثبيت والتشغيل من Termux (أندرويد) خطوة بخطوة

تم تصميم هذا المشروع ليعمل بسلاسة فائقة على **هاتف الأندرويد عبر تطبيق Termux** أو على أي جهاز كمبيوتر/سيرفر، مع **مزامنة مباشرة إلى وحدة التخزين الداخلية في مجلد التنزيلات (`/sdcard/Download/AvantisCryptoMemory`)** و**بدون الحاجة نهائياً إلى مفتاح Binance الخاص**.

---

## ✅ أولاً: تجهيز تطبيق Termux ومنح صلاحيات التخزين (مهم جداً)

افتح تطبيق **Termux** (يفضل تنزيل آخر إصدار من F-Droid أو GitHub)، ونفّذ الأوامر التالية بالترتيب:

```bash
# 1. تحديث مستودعات Termux والحزم الأساسية
pkg update -y && pkg upgrade -y

# 2. منح صلاحية الوصول إلى الذاكرة الداخلية ومجلد التنزيلات (/sdcard/Download)
termux-setup-storage

# 3. تثبيت Node.js وأدوات البناء و Git و Python و tmux
pkg install -y nodejs-lts git python clang make pkg-config openssl curl unzip
```

> **ملاحظة:** عند تنفيذ `termux-setup-storage` ستظهر نافذة على شاشة الهاتف تطلب السماح بالوصول للملفات، اضغط **السماح (Allow)**.

---

## 📦 ثانياً: اختيار طريقة جلب المشروع (من التنزيلات أو من GitHub)

### الخيار (أ): التشغيل مباشرة إذا قمت بتنزيل ملف المشروع داخل مجلد التنزيلات (`Download`)

إذا كان المشروع مضغوطاً بصيغة `.zip` أو داخل مجلد في `Download` على هاتفك:

```bash
# 1. إنشاء مجلد عمل داخل Termux ونسخ المشروع من التنزيلات إليه (أسرع في التشغيل وتثبيت المكتبات)
mkdir -p ~/crypto-bot
cp -r /sdcard/Download/avantis-crypto/* ~/crypto-bot/ 2>/dev/null || true

# أو إذا كان ملفاً مضغوطاً باسم project.zip في مجلد التنزيلات:
cd ~/crypto-bot
unzip /sdcard/Download/*.zip -d ~/crypto-bot

# 2. الدخول إلى مجلد المشروع
cd ~/crypto-bot
```

---

### الخيار (ب): التثبيت عبر GitHub مباشرة

إذا رفعت المشروع على مستودع GitHub خاص بك:

```bash
# 1. استنساخ المشروع من GitHub
cd ~
git clone https://github.com/USERNAME/REPO_NAME.git crypto-bot

# 2. الدخول للمجلد
cd ~/crypto-bot
```

*(استبدل `USERNAME/REPO_NAME` برابط مستودعك).*

---

## ⚙️ ثالثاً: تثبيت المكتبات وتجهيز ملف البيئة ومجلد الذاكرة في التنزيلات

```bash
# 1. إنشاء مجلد الذاكرة الدائمة في وحدة التخزين الداخلية (التنزيلات)
mkdir -p /sdcard/Download/AvantisCryptoMemory/coins

# 2. نسخ ملف إعدادات البيئة الافتراضي
cp .env.example .env

# 3. تعديل المسار في ملف .env للتأكيد على الحفظ المباشر في التنزيلات
cat << 'EOF' > .env
AGNES_BASE_URL="https://apihub.agnes-ai.com/v1"
AGNES_API_KEY="sk-ctBztqbDFE41jH76EcqX1Xgn6zFk0l9AJieBufBfWEUR3vBR"
AVANTIS_SYNC_DIR="/sdcard/Download/AvantisCryptoMemory"
PORT=3000
EOF

# 4. تثبيت كافة حزم ومكتبات المشروع بدقة
npm install --no-audit --no-fund
```

---

## ⚡ أو استخدم سكربت التثبيت التلقائي بسطر واحد

المشروع يحتوي على ملف `termux_setup.sh` جاهز، شغّله هكذا:

```bash
chmod +x termux_setup.sh
./termux_setup.sh
```

---

## 🚀 رابعاً: أوامر التشغيل اليومية في Termux

### 1. التشغيل المباشر السريع (وضع التطوير المدمج كامل الواجهة + الخادم):
```bash
cd ~/crypto-bot
npm run dev
```

### 2. أو البناء الإنتاجي وتشغيله في الخلفية باستمرار (24/7):
```bash
cd ~/crypto-bot
npm run build
npm start
```

### 3. تشغيله في الخلفية مع منع توقف الهاتف (Wake-Lock):
```bash
# منع النظام من إيقاف Termux في الخلفية
termux-wake-lock

# التثبيت والتشغيل عبر PM2 ليبقى يعمل حتى لو أغلقت نافذة Termux
npm install -g pm2
pm2 start "npx tsx server.ts" --name avantis-bot
pm2 logs avantis-bot
```

---

## 🌐 خامساً: فتح واجهة الويب على متصفح الهاتف أو الكمبيوتر

بعد ظهور رسالة السيرفر:
`Server running on http://0.0.0.0:3000`

1. افتح متصفح **Chrome** على نفس الهاتف واكتب:
   `http://localhost:3000`
2. أو للفتح من كمبيوتر متصل بنفس شبكة الواي فاي:
   اعرف IP الهاتف عبر `ifconfig` ثم افتح `http://PHONE_IP:3000`.

---

## 💾 أين تُحفظ الملفات والذاكرة في هاتفك؟

ستجد في مدير الملفات داخل مجلد **`Download/AvantisCryptoMemory/`** الملفات التالية تتحدث فورياً:
- `ai_providers_config.json` ← يحتوي على جميع مواقع ومفاتيح ونماذج الذكاء الاصطناعي (يتعدل فوراً عند تغيير أي مفتاح من واجهة الويب).
- `checkpoint_state.json` ← نقطة التوقف الأخيرة (العملة، الفريم، آخر فحص) للاستئناف التلقائي عند التشغيل التالي.
- `learning_journal.json` ← السجل الكامل لنتائج الصفقات والدروس المستخلصة.
- `coins/BTCUSDT.json` (وملف منفصل لكل عملة) ← ذاكرة الدعوم والمقاومات والمصائد المكتشفة وقواعد التعلم الخاصة بكل عملة لوحدها.
