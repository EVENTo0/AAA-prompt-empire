# 03 — سجل الأدلة

تاريخ المراجعة 2026-09-28؛ تاريخ جلسة التحقق 2026-09-29 بتوقيت دبي. الأدلة مربوطة بالـSHA، وتحتاج إعادة فحص عند تغييره. هذا الملف يميز نتيجة API الحية عن سرد المراجعة السابق.

| الدليل | الحالة | ما أُثبت وحدوده |
| --- | --- | --- |
| GitHub owned inventory | VERIFIED | اتصال GitHub، affiliation=owner، page_size=100 أعاد 33 مستودعًا؛ لقطة [JSON](owned-repositories.json). هذا دليل عضوية فقط |
| Empire PR #26 قبل الإصلاح | VERIFIED | Draft، مفتوح، mergeable عند `599256bda33e4528964ad5b24830bbb68a10fcaa`؛ [PR](https://github.com/EVENTo0/AAA-prompt-empire/pull/26) |
| Empire historical CI | VERIFIED كدليل تاريخي | [Empire Guard 35725470414](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/35725470414) و[Mobile 35725470254](https://github.com/EVENTo0/AAA-prompt-empire/actions/runs/35725470254) ناجحان على head القديم. lifecycle guard مرتبط بالتاريخ؛ لا يُستنتج نجاح اليوم |
| EVENTO ONE PR #3 | VERIFIED على SHA المحدد | GitHub API أعاد `success` لـ[run 36281810755](https://github.com/EVENTo0/Evento-One/actions/runs/36281810755) على `ac0bb3b886e72dd28eb3c9c226d12ddc25638a8b`. وجود hosted tenant journey أو production غير مثبت بهذا الفحص |
| نتائج باقي المنتجات في تقرير 28 سبتمبر | UNVERIFIED في جولة Registry | مدخل تخطيط من المالك، وليست إعادة تشغيل مستقلة. تغلق كل بوابة من مستودعها |
| Actions على sibling main | BLOCKED للقبول بعد الموعد المسجل | debt ما زال `detected`؛ PR مصحح غير مدمج لا يصلح main. لا استثناء ولا skip أضيفا |
| evex-lab Actions | VERIFIED كدين إضافي | [main عند db828b4](https://github.com/EVENTo0/evex-lab/tree/db828b4b7f6c7533ce4fddf243970883d633c4ce/.github/workflows): checkout@v4، setup-node@v4، setup-python@v5، upload-artifact@v4. أضيف إلى lifecycle بوصفه المستودع العاشر، فتصبح 9 siblings غير محسومة |
| Next في Empire Mobile Control Plane | PARTIALLY VERIFIED | manifest عند baseline هو `16.2.12`، ضمن نطاق النسخ المتأثرة في [تحديث 22 سبتمبر الرسمي](https://nextjs.org/blog/nextjs-security-update-september-22-2026). الهدف المتاح `16.3.6` في PR معزول؛ لا يوجد `next/og`/`ImageResponse` ظاهر في app/lib/components. هذا لا يلغي وجوب patch ولا يثبت exploitability |
| المرآة في Website | UNVERIFIED | العقد يتطلب `asOf=2026-09-28`؛ هذا PR لا يعدل مستودع الموقع |
| Supabase inventory | VERIFIED ضمن نطاق الاتصال فقط | `list_projects` أعاد 11 مشروعًا ظاهرًا بدل 10 في التقرير السابق؛ يتضمن Evento-One المنشأ في 2026-09-26. [دليل منقح](supabase-inventory-summary.json)؛ ليس عددًا عالميًا لكل الاتصالات ولا دليل ربط التطبيق أو كلفته أو صلاحياته |

الإصداران `16.3.7`/`15.5.27` ما زالا ضمن [إعلان إصدار 30 سبتمبر القادم](https://nextjs.org/blog/upcoming-nextjs-security-release-september-2026)؛ يعاد التحقق من إتاحتهما وadvisories قبل اعتمادهما. لا يُثبت إصدار غير منشور في lockfile.

## Ev-Bot: نطاق مستقل عن default-branch debt

أظهر فحص منفذ Ev-Bot في هذه الجولة أن `release/v1.0-rc1` عند `eb0f0266` يحتوي 9 workflows مع checkout@v4/setup-node@v4. هذه ملاحظة على **release branch**؛ لا تضاف إلى عدد default-branch debt دون فحص main. الصيانة الخاصة به تبقى PR مستقلًا إلى release line.

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
- `npm run test:contracts`: PASS؛ 13/13، بما فيها منع عودة تصنيف OCTA/legacy الخاطئ ومطابقة inventory وعقد الحقيقة التجارية.
- `npm run typecheck` و`npm run build`: PASS؛ Next 16.2.12، بناء 8 صفحات؛ لا يثبت hosted أو device أو security patch.
- Lifecycle regression: PASS؛ 5 eval cases الموجودة، فحصا التاريخ الحالي، وحذف evex-lab: 8 سيناريوهات؛ warn→block ورفض اللقطة الناقصة محفوظة.
- `python scripts/validate_runtime_lifecycle.py --today 2026-09-29`: BLOCKED كما يتطلب العقد؛ 9 sibling repositories ما زال دينها مسجلًا `detected` بعد إضافة evex-lab.

لا تُنسخ claims اختبارات من PR سابق كأنها إعادة تشغيل حالية. سجلات الاستدعاءات وملفات المنتجات قد تحتوي أسرارًا؛ الأدلة المنشورة مختصرة ومنقحة فقط.
