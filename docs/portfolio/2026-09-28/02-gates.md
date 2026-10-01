# 02 — العقود والبوابات

## Authority contract

| الحقيقة | المستودع صاحب السلطة | حدود بقية الأسطح |
| --- | --- | --- |
| Website/acquisition/leads | Evento-project-development-v1 | يُسلّم مرجع Lead عبر عقد versioned؛ لا ينشئ ledger للعملاء/المدفوعات |
| Customers/business/bookings/quotations/invoices/SaaS billing | Evento-One | المصدر الوحيد للحالة التجارية؛ provider IDs مراجع خارجية داخل النظام المسؤول |
| Mobile/operator/customer UI | evento-mobile | واجهة تستهلك عقود Website وONE؛ caching مشتق؛ لا customer/payment truth ثانية |
| Owner orchestration | Evento-octa-v10 | أوامر مؤسس محدودة ومراقبة؛ لا customer/payment/portfolio database بديل |
| Portfolio Registry | AAA-prompt-empire | الموقع وMobile Control Plane مستهلكان مشتقان؛ لا override محلي صامت |
| Legacy company capabilities | EVENTo0 وEvento-project-2 | Company Core legacy؛ freeze وإعادة استخدام انتقائية؛ لا سلطة إنتاج مستقلة |

الموقع يستهلك canonical pointer إلى revision معلوم، وليس نسخة كاملة متزامنة. يتحقق عقد Registry آليًا من أصحاب الحقيقة والمستهلكين. هذا اختبار metadata؛ قبول API الحقيقي يتطلب tenant identity وschema version وidempotency ورفض cross-tenant وإرجاع أخطاء قابلة للتعامل. لا يُنقل token إداري أو سر إلى جهاز العميل.

## شروط القبول

| البوابة | الدليل المطلوب | ما لا يغلقها |
| --- | --- | --- |
| R0 Registry | 33 repo مطابقة inventory، تصنيف 5/8/19/1/0، authority contract، اختبارات، freshness | عدد يدوي فقط أو تقرير قديم |
| R1 Actions | الفحوص المطلوبة ناجحة على head المصحح؛ main debt موثق حتى الدمج | PR مفتوح أو YAML فقط |
| R2 Framework security | advisory رسمي/إصدار متاح، lockfile متسق، regression مرتبط بالتغيير | رقم إصدار مستقبلي أو تغيير manifest وحده |
| W1 Staff Inbox | staff authenticated يقرأ سجل اختبار معروف؛ غير مخول يرفض عند UI/API وRLS؛ تنظيف البيانات | service role أو مجرد policy definition |
| O1 OCTA access | login بحساب اصطناعي authenticated غير مخول؛ founder guard deny؛ SELECT لا يعيد fixture مؤسس معروف؛ INSERT يرفض ولا يترك صفًا | anon denial، جدول فارغ بلا control، SQL metadata، أو service role |
| O2 OCTA runtime | start/restart/checkpoint/recover على بيئة معزولة، source SHA وredacted logs | نجاح build فقط |
| E1 ONE isolated | tests/lint/TS/build وpgTAP معزول على head؛ auth/invoice/payment regressions | رابط green على head سابق |
| E3 Company contract | versioned ONE API؛ qualified lead handoff؛ تبني Mobile؛ contract/auth/idempotency واختبار مسار فعلي | وثيقة authority أو read-only endpoint منفرد |
| E2 ONE hosted | mapping Supabase واضح؛ founder وtenant ثانٍ؛ isolation وCRUD عبر جلسات حقيقية | إعداد env شكلي أو local pgTAP فقط |
| M1 Mobile | versioned contracts وAPI target موثق وartifact مربوط بالمصدر | static inspection فقط |
| M2 Device + TEST | جهاز Android فعلي، install/login/pay TEST/restart ومسار فشل محفوظ | emulator بدل ادعاء physical device |
| P1 Sandbox sale | Lead→quote→verified TEST payment→build/preview→revision→acceptance/delivery؛ IDs مترابطة | تغيير status يدوي إلى paid |
| B1 Budget | فواتير وتجديدات وضريبة ومجموع شهري فعلي مقابل AED 1,000 | استنتاج مبلغ من Pro plan |
| B2 Recovery | backup محدد واستعادة معزولة وقراءة data assertions وتوقيت موثق | وجود GitHub وحده |
| F1 Release | حزمة قبول المالك ثم إعداد البيئة والsecrets/DNS/signing والنشر والrollback حسب الحاجة | موافقة عامة على إصلاحات التطوير |

## حالات الدليل

- `VERIFIED`: فُحص مباشرة؛ يذكر SHA والبيئة والوقت والرابط/الأمر والنتيجة.
- `PARTIALLY VERIFIED`: دليل جزئي مع المتبقي بالاسم.
- `UNVERIFIED`: لم ينفذ الاختبار المطلوب أو لا يتوفر أثره.
- `BLOCKED`: السبب وأثره وأقل مدخل لاستكماله مسجلان؛ بقية العمل المستقل يستمر.

لا تعادل نسبة اختبارات الوحدة نسبة اكتمال مشروع. لا يمكن جمع gates غير متجانسة إلى ادعاء «100%» ما دامت hosted/device/commercial gates مفتوحة. كل بوابة تنتهي بنتيجة فعلية أو مانع محدد لا بوعد.

لا تُنقل capability إلى AAA-prompt Core قبل مشروعين ممثلين وregression وsecurity review وقرار منفصل. لا يغيّر هذا العقد صلاحيات المستخدمين أو قواعد RLS بنفسه.
