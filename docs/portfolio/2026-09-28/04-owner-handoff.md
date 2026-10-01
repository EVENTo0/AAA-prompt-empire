# 04 — الاختبار والإعداد النهائي للمالك

هدف هذه الحزمة أن يرى المالك عملًا متكاملًا قابلًا للاختبار، مع أقل تدخل ممكن بعد إتمام كل تطوير واختبار متاح. لا يُطلب منه اعتماد كل تغيير روتيني منفرد. العوائق الحقيقية تبقى صريحة؛ تأجيل الإعداد لا يثبت بيئة لم تُشغّل.

## قبل التسليم النهائي

لكل مشروع مرشح: فرع/PR وSHA محددان، CI على head، دليل الواجهة وقاعدة البيانات والصلاحيات، Known Issues محددة، بيانات synthetic فقط، rollback، وإرشادات تشغيل من clean checkout. يجب أن تكون حقيقة كل سجل تجاري في النظام المسؤول عنه، مع trace IDs تربط المسار.

لا يُدمج PR يمكن أن يفعّل deployment تلقائيًا في هذه الجولة. ولا تُلغى خدمات/مشروعات Supabase أو تُنقل أسرار أو تُنشر متاجر لتقليل قائمة العوائق.

فجوات الكود لا تُرحّل بوصفها إعدادًا: Website qualified-lead handoff وMobile adoption والحفظ الذري في MODURA تبقى مراحل تنفيذ واختبار مستقلة حتى تغلق؛ [نقطة التحقق](05-session-checkpoint.md) تميزها عن الحسابات/الأجهزة/النشر.

## ما يجمع مرة واحدة في النهاية

| المتطلب | الإعداد الذي ينجزه الفريق مسبقًا | تدخل النهاية فقط عند الحاجة |
| --- | --- | --- |
| Hostinger أو بيئة التشغيل القائمة | compatibility checklist، build artifact/Docker إن كان مناسبًا، env.example بلا أسرار، health check، restart/backup/rollback | اختيار/ربط بيئة موجودة وصلاحية الوصول؛ لا شراء VPS تلقائي |
| Supabase mapping | migrations واختبارات isolated وseed اصطناعي؛ قائمة project refs المطلوبة فقط | الربط المصرح به أو credentials بالمسار الآمن؛ لا إرسال أسرار في chat/PR |
| Supabase maintenance | مراجعة advisory الرسمي وحدود database minor upgrade وتأثيره على indexes/crypto وrestore قبل أي تغيير | جدولة تغييرات البنية في النهاية بعد تحقق compatibility والbackup؛ لا production upgrade ضمن تصحيح Registry |
| Accounts/auth | harness لحساب مصرح وآخر غير مخول وتنظيف fixtures | وصول حساب الاختبار إذا تعذر إنشاؤه/استخدامه ضمن الصلاحيات الحالية |
| Android/device | artifact مرتبط بـSHA وخطوات اختبار واضحة | تجربة جهاز فعلي حيث لا يتوفر جهاز للفريق |
| Stripe | TEST fixtures، webhooks موثقة، تحقق الحالة/idempotency وfailure flows | TEST account mapping عند الحاجة؛ Live activation يبقى لاحقًا |
| Legal/commercial | draft pricing/terms/support/retention وحدود الخدمة | قرار صاحب العمل ومراجعة مختص عند الحاجة |
| Budget | قالب فواتير وتجديدات وحساب شامل الضريبة | الفواتير غير المتاحة؛ لا invent قيم |
| Publish | release checklist وmonitoring وrollback ومخاطر محددة | قبول النسخة المرئية وقرار النشر/DNS/signing/store النهائي |

## اختبار المالك الموحّد

1. افتح معاينة مرتبطة بالنسخة، وسجّل كمؤسس ثم مستخدم عادي؛ راجع الاختلاف في الصلاحيات.
2. نفّذ مسار عميل اصطناعي كامل: طلب، عرض، دفع TEST مثبت، معاينة هاتف، مراجعة، قبول وتسليم.
3. راجع failure/recovery: رفض cross-tenant، webhook مكرر، انقطاع مزود، restart واستعادة تجريبية.
4. راجع التكلفة الشهرية الفعلية وحدود التجربة ومشكلات الإصدار المتبقية.
5. اعتمد نطاق نشر محددًا وبيئة محددة؛ بعد النشر يعاد smoke test على نفس SHA وتُفحص المراقبة والrollback.

## سجل العوائق النهائية

يسجل كل عائق بصيغة: `gate ID / project / exact missing capability / work already complete / minimal owner input / resume command or test / evidence after completion`. لا تعد المصادقة السلبية أو device proof أو hosted proof «اختبارات ناجحة» إذا لم تحدث. يستمر العمل المستقل حتى تصبح الحزمة قابلة للمراجعة، ثم تعرض هذه المدخلات مجمعة.
