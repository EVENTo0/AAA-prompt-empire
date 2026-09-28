# 01 — خطة التنفيذ

## حدود العمل الجاري

تُحسب المسارات بحسب النتيجة المشتركة، مع فرع منفصل ومالك دمج واحد لكل مستودع. لا تعني حالة `active` التاريخية في السجل أن جميع المنتجات تحت تطوير متزامن.

| المسار ACTIVE | النتيجة | العمل المستقل المسموح الآن | بوابة الخروج |
| --- | --- | --- | --- |
| 1. EVENTO Revenue | Website → ONE → Mobile → أول دورة عميل تجريبية | Staff Inbox، تصحيح أمني موثق، tenant isolation، العقود، Stripe TEST، اختبارات الإرجاع والأخطاء | معاملة اصطناعية قابلة للتتبع من Lead إلى قبول وتسليم، ثم تجربة المالك |
| 2. Engineering Maintenance | CI وسجل واحد صحيحان | PR #26، صيانة Actions معزولة، إصلاح EVEX CI، ترقيات أمنية مدعومة بالأدلة | كل PR له فحوص على head الحالي؛ دين main يبقى ظاهرًا حتى إصلاحه |
| 3. OCTA Founder Readiness | قيادة المؤسس وصلاحيات واستعادة مثبتة | اختبار authenticated غير مخول، harness آمن، إعداد تشغيل قابل للنقل، restart/restore معزول | UI guard وRLS deny بأدلة جلسة حقيقية؛ حزمة استضافة نهائية قابلة للاختبار |

| المسار SUPPORTING | النطاق المحدود |
| --- | --- |
| Ev-Bot | external Paper E2E والقياسات؛ لا مسار أموال حقيقية |
| Mawasem + UAE Seed | مصدر ودليل وجودة بيانات؛ إصلاحات أمنية ضمن مسار الصيانة |
| MODURA/Earth + MiniBella | نموذج تسعير واحد وتجربة صغيرة؛ لا تصنيع أو توسع تلقائي |
| الإعلان القضائي الذكي | حزمة النموذج التنفيذي والتكلفة؛ اعتماد هندسي/شراء في النهاية |
| Budget & Recovery | فواتير موثقة، مجموع فعلي، restore test معزول؛ دون اشتراك جديد |

## قائمة المستودعات كاملة

البوابات التالية مشتقة من مراجعة المالك؛ لا تعني أن سلوك المنتج أُعيد اختباره في جولة Registry. يربط منفذ كل مشروع نتيجة الاختبار بفرعه وSHA قبل تغيير الحالة.

| المستودع | الحزمة التالية | شرط إغلاق الحزمة |
| --- | --- | --- |
| Evento-project-development-v1 | إكمال PR #10 | Staff Inbox: موظف مصرح ينجح وحساب غير مخول يُرفض؛ Lead محفوظ؛ مرآة Registry متزامنة |
| Evento-One | أمان + hosted tenant journey + pilot | التحقق من patch رسمي متاح؛ regression؛ مؤسس وtenant ثانٍ؛ دورة Stripe TEST |
| evento-mobile | صيانة ثم contract/device | CI على head؛ API target الحالي؛ جهاز Android فعلي؛ Stripe TEST |
| EVENTo0 | تجميد مصدر قدرات legacy | ترقية انتقائية مثبتة فقط؛ لا حقيقة إنتاج مستقلة |
| Evento-project-2 | reconciliation/legacy | نقل الحاجة المثبتة دون نسخ مصدر منافس؛ archive يبقى قرارًا نهائيًا |
| AAA-prompt-empire | Registry #26 | العضوية والتصنيف والعقود والاختبارات؛ توثيق دين lifecycle دون إخفائه |
| AAA-prompt | صيانة #2 | CI على head؛ لا capability backport |
| empire-mobile-control-plane | maintenance consumer | يتبع Registry؛ لا بيانات حقيقة مكررة |
| omniform-nexus-professor-ai | Preview + Issue #3 | build مربوط بالمصدر، متصفح وهاتف، five-layer CI حديث |
| Smart-OS-Generate-Any-Project-From-Title | إثبات ممثل | EVENTO ومنتج ثانٍ؛ لا Core promotion من اختبار واحد |
| Evento-octa-v10 | إكمال #2 access gate | authenticated non-founder: UI deny وRLS SELECT/INSERT deny |
| OCTA-VOICE | صيانة #2 فقط | CI؛ G1 محفوظ؛ Voice DNA/G2 لا يصبحان مثبتين بالبرمجيات وحدها |
| UAE-Seed-Dataset | evidence provenance | مصدر وتاريخ وحقوق استخدام لكل عينة |
| MiniBella | أمان + persisted pilot | تجربة 20 ضيفًا محفوظة وتكلفة المكونات/التبريد/النقل/الهدر/العمل |
| Ev-Bot | dedicated backend + Paper E2E | مزود خارجي واختبار paper مع رسوم وانزلاق وdrawdown؛ no live money |
| evex-mobile | reproducibility/device | stable SDK مثبت؛ API/device/privacy/subscription sandbox |
| evex-coach | إصلاح collection ثم framework | email-validator/تبعيات صالحة؛ CI ناجح؛ migration أمني معزول |
| evex-fit | إصلاح package ثم framework | app.models.workout مثبت؛ API tests؛ migration أمني معزول |
| evex-lab | فرع الصيانة الموجود | workflows مصححة مع CI؛ لا PR فارغ؛ Next debt في حزمة تالية |
| evx-health-coach | governance/CI | PR-trigger run وصلاحيات/RLS؛ لا ادعاء طبي |
| AEGIS-AI-Security | صيانة #11 | defensive CI؛ لاحقًا signing/recovery/false-positive pilot |
| familyos | persisted family flow | parent approval وprivacy وجهاز فعلي؛ لا store publish |
| History-Med-1 | clinical/evidence review | مراجعة مؤهلة ومصادر حديثة قبل claims طبية |
| OCTORIMAL | real-host engine smoke | PlayMode/build وengine freeze بناء على تشغيل حقيقي |
| OCTOPUS | compile/PIE/GAS | UHT/UBT وتطبيق Android target باختبار؛ لا توسع ميزات قبلها |
| aetheris-studios | recovery slice | جزء واحد يعمل؛ لا bulk migration |
| saeed-game | canonical decision | مقارنة محددة مع Game-1؛ لا أرشفة أو توسع بلا القرار النهائي |
| Game-1-Saeed-octa | release contract | فرع إصدار مستقر وCI وFPS على جهاز؛ canonical decision منفصل |
| AithenaX | security/CI/paper metrics | تحقق patch، webhook security، رسوم/انزلاق/ترخيص بيانات |
| octa-xr-webar | security + XR device | patch وNode مدعومان؛ كاميرا/privacy/rate limit وتجربة جهاز |
| Evx-Mawasem-wheel | أمان ثم January evidence | مصدر رسمي قابل للتتبع، مناطق تغير المحتوى، دقة دون توقعات مختلقة |
| EVENTO-MODURA | CI/RLS/pilot | تكلفة BOM وأسعار مورد حقيقية وهوامش؛ Earth داخل MODURA |
| Evx | meta decision | umbrella أو archive؛ لا نسخ مصدر ولا مشروع جديد |

## ترتيب التنفيذ داخل الحزمة

1. اقرأ branch/AGENTS والحالة الفعلية؛ ثبّت SHA ونطاقًا صغيرًا قابلًا للمراجعة.
2. أصلح سبب الفشل، ثم اختبر السلوك المقصود وحالة رفض/فشل ملائمة.
3. اربط CI والأثر وrollback بالـPR؛ لا تستبدل head evidence بدليل commit قديم.
4. انتقل إلى الحزمة التالية المستقلة. أي مانع حساب/جهاز/سر يسجل مع أقل مدخل مطلوب في وثيقة التسليم الأخيرة.
5. أوقف التوسع الجديد في السفر والألعاب وXR/Voice/المشاريع المصغرة؛ تبقى الإصلاحات الأمنية المستقلة ممكنة في مسار الصيانة.
