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

البوابات مشتقة من مراجعة المالك، وحدّثت بنتائج التنفيذ في [نقطة التحقق](05-session-checkpoint.md). نجاح فرع لا يصلح main تلقائيًا؛ كل نتيجة مرتبطة ببيئتها وSHA.

| المستودع | الحزمة التالية | شرط إغلاق الحزمة |
| --- | --- | --- |
| Evento-project-development-v1 | إكمال PR #10 | دليل Staff Inbox الفعلي ناجح في PR10؛ pointer canonical مثبت؛ qualified lead handoff إلى ONE يحتاج تنفيذ عقد مستقل |
| Evento-One | أمان + hosted tenant journey + pilot | Next16.3.6 وisolated Auth/DB مثبتان؛ يتبقى hosted مؤسس وtenant ثانٍ وStripe TEST وتبني API versioned |
| evento-mobile | صيانة ثم contract/device | CI وAPK API36 مثبتان؛ يتبقى تبني ONE versioned API وجهاز Android فعلي وStripe TEST |
| EVENTo0 | تجميد مصدر قدرات legacy | ترقية انتقائية مثبتة فقط؛ لا حقيقة إنتاج مستقلة |
| Evento-project-2 | reconciliation/legacy | نقل الحاجة المثبتة دون نسخ مصدر منافس؛ archive يبقى قرارًا نهائيًا |
| AAA-prompt-empire | Registry #26 | العضوية والتصنيف والعقود والاختبارات؛ توثيق دين lifecycle دون إخفائه |
| AAA-prompt | صيانة #2 مدمجة خارجيًا | main17481a7 وCI ناجح؛ لا capability backport |
| empire-mobile-control-plane | maintenance consumer | يتبع Registry؛ لا بيانات حقيقة مكررة |
| omniform-nexus-professor-ai | Preview + Issue #3 | build مربوط بالمصدر، متصفح وهاتف، five-layer CI حديث |
| Smart-OS-Generate-Any-Project-From-Title | إثبات ممثل | EVENTO ومنتج ثانٍ؛ لا Core promotion من اختبار واحد |
| Evento-octa-v10 | إكمال #2 access gate | isolated real Auth + actual guard/RLS مثبت؛ hosted/full-dashboard/runtime/recovery منفصلة |
| OCTA-VOICE | صيانة #2 مدمجة خارجيًا | main0cf4dd9 وCI ناجح؛ G1 محفوظ وVoice DNA/G2 غير مثبتين |
| UAE-Seed-Dataset | evidence provenance | مصدر وتاريخ وحقوق استخدام لكل عينة |
| MiniBella | أمان + persisted pilot | تجربة 20 ضيفًا محفوظة وتكلفة المكونات/التبريد/النقل/الهدر/العمل |
| Ev-Bot | dedicated backend + Paper E2E | مزود خارجي واختبار paper مع رسوم وانزلاق وdrawdown؛ no live money |
| evex-mobile | reproducibility/device | stable SDK مثبت؛ API/device/privacy/subscription sandbox |
| evex-coach | إصلاح collection ثم framework | 39 backend tests وCI ناجحة؛ PR3 Next15.5.26 وDocker CI ناجحان؛ persistence/hosted/product gates باقية |
| evex-fit | إصلاح package ثم framework | source contracts و46 backend tests وCI ناجحة؛ PR3 Next15.5.26 وDocker CI ناجحان؛ hosted/persistence منفصلة |
| evex-lab | فرع الصيانة الموجود | PR2 صيانة وإصلاح Auth مع19 backend tests ناجحة؛ PR3 Next15.5.26 وDocker CI ناجحان؛ hosted/persistence باقية |
| evx-health-coach | governance/CI | PR2 source verification ناجح؛ مراجعة credential history وhosted RLS/privacy/device؛ لا ادعاء طبي |
| AEGIS-AI-Security | صيانة #11 مدمجة خارجيًا | main317bbda وCI ناجح؛ signing/recovery/false-positive pilot باقية |
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
| EVENTO-MODURA | CI/RLS/pilot | PR2:26 isolated tests وإصلاح pricing/RLS مثبت؛ migration غير مطبق؛ real Auth/StorageHTTP وatomic save وsupplier margin pilot باقية |
| Evx | meta decision | umbrella أو archive؛ لا نسخ مصدر ولا مشروع جديد |

## ترتيب التنفيذ داخل الحزمة

1. اقرأ branch/AGENTS والحالة الفعلية؛ ثبّت SHA ونطاقًا صغيرًا قابلًا للمراجعة.
2. أصلح سبب الفشل، ثم اختبر السلوك المقصود وحالة رفض/فشل ملائمة.
3. اربط CI والأثر وrollback بالـPR؛ لا تستبدل head evidence بدليل commit قديم.
4. انتقل إلى الحزمة التالية المستقلة. أي مانع حساب/جهاز/سر يسجل مع أقل مدخل مطلوب في وثيقة التسليم الأخيرة.
5. أوقف التوسع الجديد في السفر والألعاب وXR/Voice/المشاريع المصغرة؛ تبقى الإصلاحات الأمنية المستقلة ممكنة في مسار الصيانة.
