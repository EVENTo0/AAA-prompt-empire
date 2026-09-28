# 03 — سجل الأدلة

تاريخ المراجعة 2026-09-28؛ تاريخ جلسة التحقق 2026-09-29 بتوقيت دبي. الأدلة مربوطة بالـSHA، وتحتاج إعادة فحص عند تغييره. هذا الملف يميز نتيجة API الحية عن سرد المراجعة السابق. [نقطة تحقق الجلسة](05-session-checkpoint.md) و[ledger الآلي](session-evidence.json) يحتويان نتائج التنفيذ المتوازي الأحدث؛ لا تعاد كتابة الأدلة التاريخية كأنها جديدة.

| الدليل | الحالة | ما أُثبت وحدوده |
| --- | --- | --- |
| GitHub owned inventory | VERIFIED | اتصال GitHub، affiliation=owner، page_size=100 أعاد 33 مستودعًا؛ لقطة [JSON](owned-repositories.json). هذا دليل عضوية فقط |
| Empire PR #26 قبل الإصلاح | VERIFIED | Draft، مفتوح، mergeable عند `599256bda33e4528964ad5b24830bbb68a10fcaa`؛ [PR](https://github.com/EVENTo0/AAA-prompt-empire/pull/26) |
| Empire historical CI | VERIFIED كدليل تاريخي | [Empire Guard 35725470414](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/35725470414) و[Mobile 35725470254](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/35725470254) ناجحان على head القديم. lifecycle guard مرتبط بالتاريخ؛ لا يُستنتج نجاح اليوم |
| EVENTO ONE PR #3 | VERIFIED ضمن البيئة المعزولة | [run36487710528](https://github.com/EVENTo0/Evento-One/actions/runs/36487710528) ناجح على `c869120d1b4e995483251203895eecc493c0ea23`: Next16.3.6، application/pgTAP و4 real password Auth REST suites. Hosted browser وStripe TEST الخارجي غير مثبتين به |
| نتائج باقي المنتجات | نطاقات منفصلة | نتائج الجلسة موثقة في [05](05-session-checkpoint.md) من منفذي المنتجات، وPR/CI تحقق منهما Registry مباشرة. المنتجات غير المذكورة لا تكتسب proof جديدًا تلقائيًا |
| Actions على sibling main | BLOCKED للقبول بعد الموعد المسجل | خمسة entries ما زالت `detected` بعد4 maintenance merges تحقّق منها مستقلاً؛ PR مصحح غير مدمج لا يصلح main. لا استثناء ولا skip أضيفا |
| evex-lab Actions | VERIFIED كدين إضافي | [main عند db828b4](https://github.com/EVENTo0/evex-lab/tree/db828b4b7f6c7533ce4fddf243970883d633c4ce/.github/workflows): checkout@v4، setup-node@v4، setup-python@v5، upload-artifact@v4. أضيف إلى lifecycle بوصفه المستودع العاشر؛ كان العدد9 عند9b5335b، ثم صار5 بعد4 merges متزامنة مثبتة |
| Next في Empire Mobile Control Plane | VERIFIED على الفرع | PR27 عند `d84c41c22749b50c9f918d42693b2c00f512ec19` يصحح16.2.12 إلى16.3.6؛ CI ناجح. نُسخ نفس manifest/lock byte-for-byte إلى PR26 لاختبار التركيب؛ [advisory الرسمي](https://nextjs.org/blog/nextjs-security-update-september-22-2026). لا يوجد next/og/ImageResponse ظاهر؛ لا claim exploitability |
| مرجع Website إلى Registry | VERIFIED pointer-only | فُحص `config/evento-assets.json.portfolioRegistryReference` على Website `793f1441da718bf2129931d994df3101f5a250bc`: المصدر9b5335b وasOf2026-09-28. هذا pointer إلى لقطة غير مدمجة، وليس mirror كاملًا؛ project-universe.json غير موجود |
| Supabase inventory | VERIFIED ضمن نطاق الاتصال فقط | `list_projects` أعاد 11 مشروعًا ظاهرًا بدل 10 في التقرير السابق؛ يتضمن Evento-One المنشأ في 2026-09-26. [دليل منقح](supabase-inventory-summary.json)؛ ليس عددًا عالميًا لكل الاتصالات ولا دليل ربط التطبيق أو كلفته أو صلاحياته |

الإصداران `16.3.7`/`15.5.27` ما زالا ضمن [إعلان إصدار 30 سبتمبر القادم](https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026)؛ يعاد التحقق من إتاحتهما وadvisories قبل اعتمادهما. لا يُثبت إصدار غير منشور في lockfile.

## Ev-Bot: نطاق مستقل عن default-branch debt

أظهر فحص منفذ Ev-Bot في هذه الجولة أن `release/v1.0-rc1` عند `eb0f0266` يحتوي 9 workflows مع checkout@v4/setup-node@v4. هذه ملاحظة على **release branch**؛ لا تضاف إلى عدد default-branch debt دون فحص main. الصيانة أُنجزت في [PR11](https://github.com/EVENTo0/Ev-Bot/pull/11) إلى release line عند `c67313def7718f613255841cc900638e36388d80`، وثمانية workflows ناجحة؛ لا merge. لا يغير ذلك دين default branch تلقائيًا.

سجل التشغيل المشترك الحالي لـ`npm run verify:rc` يثبت 31 node tests و5 release checks؛ لا يعاد تقديم العدد التاريخي 173 على أنه أُعيد تشغيله اليوم. dedicated Supabase reported INACTIVE في فحص المنفذ، وبالتالي external Paper E2E يبقى بوابة منفصلة. لا ناتج لهذه الفحوص يجيز التداول الحقيقي.

## التحقق القابل للتكرار

من جذر Empire:

```bash
python scripts/validate_empire.py
python scripts/run_empire_evals.py
python scripts/test_runtime_lifecycle.py
python scripts/validate_runtime_lifecycle.py --today 2026-09-29
```

من `apps/mobile-control-plane`:

```bash
npm run test:contracts
npm run typecheck
npm run build
```

الأمر lifecycle متوقع أن يفشل بسبب دين sibling الحالي؛ هذه نتيجة حقيقية معلنة، وليست بوابة ناجحة. يتم الاحتفاظ بمقارنة `--today 2026-09-22` و`--today 2026-09-23` لاختبار انتقال warn→block، دون استخدامها لتجاوز تاريخ اليوم في CI.

## نتائج الإصلاح

- `python scripts/validate_empire.py`: PASS؛ 27 skills و22 agents.
- `python scripts/run_empire_evals.py`: PASS؛ 18 routing/permission cases.
- التحقق الأول عند9b5335b: contracts13/13 وtypecheck/build على16.2.12؛ دليل تاريخي استُبدل تركيبه الأمني بالتحقق التالي، ولا يعاد تقديمه كنسخة نهائية.
- PR27 المعزول: manifest/lock16.3.6 وbuild/typecheck و7baseline contracts و10HTTP auth checks؛ [Mobile CI36487783259](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/36487783259) و[Guard36487783002](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/36487783002) ناجحان. هذا main-based PR ولا يحتوي سجل الدين الجديد، لذلك لا يغلق فشل PR26.
- Lifecycle regression: PASS؛ 5 eval cases الموجودة، فحصا التاريخ الحالي، وحذف evex-lab: 8 سيناريوهات؛ warn→block ورفض اللقطة الناقصة محفوظة.
- `python scripts/validate_runtime_lifecycle.py --today 2026-09-29`: BLOCKED كما يتطلب العقد؛ 5 sibling repositories ما زال دينها مسجلًا `detected` بعد حفظ الأربع merges المتزامنة.

لا تُنسخ claims اختبارات من PR سابق كأنها إعادة تشغيل حالية. سجلات الاستدعاءات وملفات المنتجات قد تحتوي أسرارًا؛ الأدلة المنشورة مختصرة ومنقحة فقط.

## تركيب Registry مع التحديث الأمني

نفس manifest وnpm lock المختبرين في PR27 عندd84c41c نُقلا دون تعديل إلى PR26؛ لا يبقى candidate Registry على16.2.12. ترتيب دمج المراجعة لاحقًا: PR27 الأمني أولًا، ثم PR26 بعد تحديث قاعدة المقارنة وإغلاق دين main بالأدلة. لا merge في هذه الجولة. نتائج التركيب: clean `npm ci --ignore-scripts` PASS؛ 14/14 contracts PASS؛ typecheck PASS؛ build PASS على Next16.3.6 مع8 صفحات. Guard structural27skills/22agents و18routing و8lifecycle scenarios ناجحة؛ lifecycle current-date ما زال BLOCKED بخمسة مستودعات ولا skip أو clock override. ملفات types/config المؤقتة التي يولدها build لا تغير عقد المصدر.

## تغيير متزامن محفوظ ومتحقق

تحرك PR26 خارج منفذ Registry من9b5335b إلى`ae2d3c4c0193db8232f67e361713fb14b0cb18fe` بتعديلruntime-lifecycle واحد. لم يُستبدل: GitHub أكد merge وmain SHA وpush CI ناجح لكل AAA-prompt#2 وOCTA-VOICE#2 وMiniBella#6 وAEGIS#11. التفاصيل والأوقات في `session-evidence.json.observedConcurrentMerges`. الدين المتبقي5: Mobile وEVEX Coach/Fit/Lab وHealth Coach. عُدّل اختبار العدد ليلائم الأدلة؛ enforcement نفسه لم يُخفف. لا ينسب هذا المسار تلك merges لنفسه ولا يستنتج منها حالة أي deployment.
