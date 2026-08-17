<div align="center" dir="rtl">
  <img src="../assets/room-planner-logo.svg" alt="Room Planner" width="760" />
  <p><strong>خطّط للمساحات، وضع الأثاث، وتجول داخل تصميمك مباشرة من المتصفح.</strong></p>
  <p>مخطط غرف ثلاثي الأبعاد يعمل محليًا، مبني باستخدام React وThree.js.</p>
  <p><a href="../../README.md">中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.fr.md">Français</a> · <a href="README.it.md">Italiano</a> · <a href="README.es.md">Español</a> · <a href="README.pt.md">Português</a> · <strong>العربية</strong></p>
  <p><img src="https://img.shields.io/badge/React-19-20232a?style=flat-square&logo=react&logoColor=61dafb" alt="React 19" /> <img src="https://img.shields.io/badge/Three.js-r185-20232a?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js r185" /> <img src="https://img.shields.io/badge/TypeScript-5.9-20232a?style=flat-square&logo=typescript&logoColor=3178c6" alt="TypeScript 5.9" /> <img src="https://img.shields.io/badge/Vite-7-20232a?style=flat-square&logo=vite&logoColor=bd8cff" alt="Vite 7" /></p>
</div>

---

<div dir="rtl">

## لماذا Room Planner؟

يجمع Room Planner بين تنظيم المساحات، ووضع الأثاث بدقة، والتحقق الغامر في مسار عمل واحد. رتّب الغرف في وضع التخطيط، وضع الأثاث بمقاساته الحقيقية في وضع المسقط، ثم افحص الحركة والنِسب من منظور الإنسان في وضعي التجول أو الانغماس.

| التخطيط | المسقط | التجول | الانغماس |
|:---:|:---:|:---:|:---:|
| تنظيم الغرف | وضع الأثاث بدقة | استكشاف بمنظور علوي مائل | تصادم وتفاعل من منظور الشخص الأول |

## أبرز الميزات

- **مساحات وغرف متعددة** — إنشاء الغرف وتحريكها وتدويرها وإعادة تسميتها والتبديل بينها.
- **غرف قابلة للضبط** — إعداد الأبعاد والأبواب والنوافذ والأسقف والعوائق الركنية.
- **أثاث بمقاس حقيقي** — 10 أنواع مع معاينة شفافة، وفحص التصادم، والنقل بين الغرف، وعرض الأبعاد على الحواف.
- **أربعة أوضاع للعرض** — التخطيط، والمسقط، والتجول، والانغماس.
- **تفاعل غامر** — اقترب من الباب وانظر نحوه ثم اضغط `F` لفتحه أو إغلاقه بحركة واقعية.
- **ارتفاع عين قابل للتعديل** — القيمة الافتراضية العامة `1.7 m`، ويمكن ضبطها بين `1–2.5 m`.
- **يعمل محليًا أولًا** — تُحفظ الخطط في `localStorage` داخل المتصفح ولا تحتاج إلى خادم خلفي.

## البدء السريع

</div>

```bash
npm install
npm run dev
```

<div dir="rtl">افتح العنوان المحلي الذي يعرضه Vite. ينتقل التطبيق تلقائيًا إلى <code>/planner</code>.</div>

```bash
npm test        # تشغيل الاختبارات
npm run build   # فحص الأنواع وبناء نسخة الإنتاج
npm run lint    # تشغيل ESLint
```

<div dir="rtl">

## عناصر التحكم

| الوضع | التحكم |
| --- | --- |
| التخطيط | اسحب الغرف؛ اضبطها أو دوّرها أو احذفها من الشريط؛ انقر مرتين للدخول |
| المسقط | اسحب للتحريك، واستخدم العجلة للتكبير، واختر أثاثًا ثم انقر على الأرضية |
| التجول | `WASD` للحركة، `Space` للصعود، `C` للهبوط، `Shift` للتسريع، والسحب للنظر |
| الانغماس | `WASD` للحركة، `Shift` للجري، `Space` للقفز؛ اضغط `F` قرب باب محدد |
| عام | يلغي `Esc` العملية أو يعيدك إلى وضع المسقط |

## التقنيات

`React 19` · `TypeScript 5.9` · `Three.js r185` · `Tailwind CSS 3` · `Radix UI` · `Vite 7` · `Vitest 4`

## ملاحظة البيانات

لا يرفع الإصدار الحالي بيانات الغرف أو الأثاث إلى أي خادم. يؤدي مسح بيانات الموقع من المتصفح إلى حذف الخطط المحفوظة أيضًا.

</div>
