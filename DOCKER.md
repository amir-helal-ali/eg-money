# 🐳 Eg-Money — Docker Setup

دليل كامل لتشغيل منصة Eg-Money عبر Docker للتطوير والإنتاج.

---

## 📋 المتطلبات

- **Docker** 24+ → [تحميل](https://docs.docker.com/get-docker/)
- **Docker Compose** v2+ (مدمج في Docker Desktop)
- ملف `.env` (انسخ من `.env.example` وعدّل القيم)

```bash
cp .env.example .env
# عدّل القيم في .env حسب بيئتك
```

---

## 🔧 التطوير (Development)

### تشغيل سريع
```bash
npm run docker:dev
```

هذا الأمر:
1. يبني صورة التطوير (`Dockerfile.dev`)
2. يثبّت كل الـ dependencies (بما فيها devDependencies)
3. يُولّد Prisma client
4. يُطبّق schema على قاعدة البيانات
5. يشغّل الـ ticker-service + Next.js dev server
6. يحمّل الكود المصدري كـ volume (hot reload)

### الأوامر المتاحة
| الأمر | الوصف |
|-------|-------|
| `npm run docker:dev` | تشغيل في الـ foreground (Ctrl+C للإيقاف) |
| `npm run docker:dev:detach` | تشغيل في الخلفية |
| `npm run docker:dev:logs` | عرض الـ logs |
| `npm run docker:dev:down` | إيقاف الحاوية |

### المنافذ
- **3000** → Next.js app (http://localhost:3000)
- **3003** → Ticker WebSocket
- **3004** → Ticker HTTP (للـ balance updates + notifications)

### ملفات persistent
- `eg-money-dev-db` → قاعدة بيانات SQLite (تبقى بعد إيقاف الحاوية)

---

## 🚀 الإنتاج (Production)

### 1. إعداد `.env`
```bash
cp .env.example .env
```

عدّل القيم الحرجة:
```env
DATABASE_URL=file:/app/db/custom.db
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
CRON_SECRET=<random-string>
SMTP_HOST=smtp.yourprovider.com
SMTP_USER=...
SMTP_PASS=...
```

### 2. البناء + التشغيل
```bash
npm run docker:prod
```

هذا الأمر:
1. يبني صورة الإنتاج المُحسّنة (multi-stage build)
2. يشغّل الحاوية في الخلفية (`-d`)
3. يطبّق database schema تلقائياً
4. يشغّل Next.js + ticker-service معاً
5. يُفعّل health check كل 30 ثانية

### 3. إدارة الحاوية
| الأمر | الوصف |
|-------|-------|
| `npm run docker:prod:logs` | عرض الـ logs |
| `npm run docker:prod:down` | إيقاف الحاوية |
| `npm run docker:build` | بناء الصورة فقط (`eg-money:latest`) |
| `npm run docker:run` | تشغيل الصورة المبنية يدوياً |

### 4. إعادة بناء بعد تحديث الكود
```bash
git pull
npm run docker:prod      # --build يعيد البناء تلقائياً
```

---

## 🏗️ بنية الـ Dockerfile (Multi-stage)

```
Stage 1: deps        → تثبيت dependencies الإنتاج
Stage 2: builder     → بناء Next.js (standalone output)
Stage 3: ticker-deps → تثبيت dependencies الـ ticker-service
Stage 4: runner      → صورة نهائية صغيرة (~200MB)
```

الصورة النهائية تحتوي:
- Next.js standalone server
- Prisma client
- Ticker service
- `docker-entrypoint.sh` يشغّل الاثنين معاً

---

## 🔍 استكشاف الأخطاء

### الحاوية لا تبدأ
```bash
# تحقق من الـ logs
docker compose logs app

# تحقق من الـ env
docker compose exec app env | grep DATABASE

# ادخل الحاوية
docker compose exec app sh
```

### قاعدة البيانات
```bash
# قاعدة البيانات محفوظة في volume
docker volume ls | grep eg-money

# نسخ احتياطي
docker compose exec app cat /app/db/custom.db > backup.db

# استعادة
docker compose cp backup.db app:/app/db/custom.db
```

### إعادة تعيين كلمة مرور الأدمن
```bash
docker compose exec app npx tsx scripts/reset-admin.ts
```

### إعادة بناء من الصفر
```bash
docker compose down -v        # يحذف الـ volumes أيضاً
docker compose build --no-cache
docker compose up -d
```

---

## 📊 رسم بياني للبنية

```
┌─────────────────────────────────────────┐
│            Docker Container              │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ Next.js App │  │ Ticker Service  │  │
│  │  (port 3000)│  │ (ports 3003/4)  │  │
│  └──────┬──────┘  └────────┬────────┘  │
│         │                  │            │
│         └──────┬───────────┘            │
│                │                        │
│         ┌──────┴──────┐                 │
│         │  SQLite DB  │                 │
│         │  (/app/db)  │                 │
│         └─────────────┘                 │
│                                         │
│  docker-entrypoint.sh manages both      │
└─────────────────────────────────────────┘
         │
    ┌────┴────┐
    │ Volume  │ → persistent DB + uploads
    └─────────┘
```

---

## ⚡ نصائح الأداء

1. **استخدم `.dockerignore`** (موجود) لتقليل حجم الـ build context
2. **الصورة الإنتاج ~200MB** بفضل multi-stage build + standalone output
3. **Health check** يعيد تشغيل الحاوية تلقائياً عند الفشل
4. **Volumes** تحفظ البيانات عبر إعادة التشغيل
5. **`restart: unless-stopped`** يضمن استمرارية الخدمة

---

## 🌐 النشر على خادم إنتاج

```bash
# على الخادم
git clone https://github.com/amir-helal-ali/eg-money.git
cd eg-money
cp .env.example .env
nano .env  # عدّل الإعدادات

# ابدأ
npm run docker:prod

# تحقق
curl http://localhost:3000
docker compose ps
docker compose logs -f --tail=50
```

### مع Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket للـ ticker
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

بعد إعداد Nginx + Let's Encrypt (HTTPS):
```bash
docker compose up -d
```
