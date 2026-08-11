import companyData from '@/data/company.json'
import serviceCatalog from '@/data/service-catalog.json'
import deliveryStages from '@/data/delivery-stages.json'
import portfolioData from '@/data/portfolio.json'
import type { Locale, Localized, LocalizedList } from '@/lib/i18n'

export type Company = {
  version: number
  legalName: string
  shortName: string
  founded: string
  tagline: Localized
  summary: Localized
  principles: { id: string; title: Localized; body: Localized }[]
  domain: string
  /**
   * Only client-facing addresses belong here. Operational mailboxes such as
   * `admin@` authenticate tool accounts and must never be published on the
   * site — a contract test fails the build if one appears.
   */
  contact: { general: string; projects: string; github: string; responseTargetHours: number }
}

export type Service = {
  id: string
  icon: string
  name: Localized
  summary: Localized
  deliverables: LocalizedList
  platforms: string[]
  routeSkill: string
}

export type Engagement = {
  id: string
  name: Localized
  duration: Localized
  outcome: Localized
}

export type DeliveryStage = {
  id: string
  order: number
  name: Localized
  body: Localized
  clientEvidence: Localized
  gate: Localized | null
}

export type EvidenceState = 'VERIFIED' | 'PARTIALLY VERIFIED' | 'UNVERIFIED' | 'BLOCKED'

export type PortfolioProject = {
  id: string
  registryId: string
  name: Localized
  kind: Localized
  summary: Localized
  platforms: string[]
  stage: string
  evidence: EvidenceState
  evidenceNote: Localized
  link: string | null
}

export const company = companyData as Company
export const services = serviceCatalog.services as Service[]
export const engagements = serviceCatalog.engagements as Engagement[]
export const stages = (deliveryStages.stages as DeliveryStage[]).slice().sort((a, b) => a.order - b.order)
export const portfolio = portfolioData.projects as PortfolioProject[]

export const stageIds = stages.map((stage) => stage.id)

export function stageById(id: string): DeliveryStage | undefined {
  return stages.find((stage) => stage.id === id)
}

export function serviceById(id: string): Service | undefined {
  return services.find((service) => service.id === id)
}

export function engagementById(id: string): Engagement | undefined {
  return engagements.find((engagement) => engagement.id === id)
}

export const evidenceLabel: Record<EvidenceState, Localized> = {
  VERIFIED: { ar: 'مُتحقَّق', en: 'Verified' },
  'PARTIALLY VERIFIED': { ar: 'مُتحقَّق جزئياً', en: 'Partially verified' },
  UNVERIFIED: { ar: 'غير مُتحقَّق', en: 'Unverified' },
  BLOCKED: { ar: 'مُعطَّل', en: 'Blocked' },
}

type Dictionary = Record<string, Localized>

const dictionary = {
  'nav.home': { ar: 'الرئيسية', en: 'Home' },
  'nav.services': { ar: 'الخدمات', en: 'Services' },
  'nav.method': { ar: 'آلية العمل', en: 'How we build' },
  'nav.projects': { ar: 'المشاريع', en: 'Projects' },
  'nav.about': { ar: 'عن الشركة', en: 'About' },
  'nav.contact': { ar: 'ابدأ مشروعاً', en: 'Start a project' },
  'nav.account': { ar: 'حسابي', en: 'My account' },
  'nav.menu': { ar: 'القائمة', en: 'Menu' },
  'nav.skip': { ar: 'تخطَّ إلى المحتوى', en: 'Skip to content' },

  'home.eyebrow': { ar: 'إيفينتو لتطوير المشاريع', en: 'EVENTO Project Development' },
  'home.ctaPrimary': { ar: 'ابدأ مشروعاً', en: 'Start a project' },
  'home.ctaSecondary': { ar: 'شاهد آلية العمل', en: 'See how we build' },
  'home.principles': { ar: 'مبادئ العمل', en: 'Operating principles' },
  'home.servicesTitle': { ar: 'ما الذي نبنيه', en: 'What we build' },
  'home.servicesLead': {
    ar: 'سبع قدرات هندسية تعمل ضمن خط تسليم واحد، لا فرق منفصلة ولا تسليم مجزّأ.',
    en: 'Seven engineering capabilities running on one delivery line, not separate teams and not fragmented handoffs.',
  },
  'home.methodTitle': { ar: 'من الطلب إلى الإصدار', en: 'From request to release' },
  'home.methodLead': {
    ar: 'ثماني مراحل ثابتة. كل مرحلة تُنتج دليلاً يمكنك مراجعته، وليست تقريراً عن نية.',
    en: 'Eight fixed stages. Each one produces evidence you can review, not a statement of intent.',
  },
  'home.projectsTitle': { ar: 'مشاريع قائمة', en: 'Live projects' },
  'home.projectsLead': {
    ar: 'حالة كل مشروع معروضة بلغة أدلة صريحة، بما في ذلك ما لم يُثبَت بعد.',
    en: 'Every project state is shown in explicit evidence language, including what is not yet proven.',
  },
  'home.allServices': { ar: 'كل الخدمات وما يُسلَّم فيها', en: 'All services and their deliverables' },
  'home.allStages': { ar: 'تفاصيل المراحل والبوابات', en: 'Stage detail and approval gates' },
  'home.allProjects': { ar: 'كل المشاريع وحالاتها', en: 'All projects and their states' },

  'services.title': { ar: 'الخدمات', en: 'Services' },
  'services.lead': {
    ar: 'اختر القدرة المطلوبة، أو صف الهدف ونحن نوجّهه إلى المسار الصحيح.',
    en: 'Pick the capability you need, or describe the outcome and we route it to the right track.',
  },
  'services.deliverables': { ar: 'ما يُسلَّم', en: 'What is delivered' },
  'services.engagements': { ar: 'أنماط التعاقد', en: 'Engagement models' },
  'services.engagementsLead': {
    ar: 'يمكنك البدء بأصغر التزام والتوسّع بعد رؤية دليل ملموس.',
    en: 'You can start at the smallest commitment and scale up after seeing concrete evidence.',
  },
  'services.duration': { ar: 'المدة', en: 'Duration' },
  'services.outcome': { ar: 'الناتج', en: 'Outcome' },
  'services.requestThis': { ar: 'اطلب هذه الخدمة', en: 'Request this service' },

  'method.title': { ar: 'آلية العمل', en: 'How we build' },
  'method.lead': {
    ar: 'الآلية نفسها تُطبَّق على مشاريع الشركة الداخلية وعلى مشاريع العملاء، بلا استثناء.',
    en: 'The same mechanism applies to internal company projects and to client projects, without exception.',
  },
  'method.stage': { ar: 'المرحلة', en: 'Stage' },
  'method.evidence': { ar: 'الدليل الذي تستلمه', en: 'Evidence you receive' },
  'method.gate': { ar: 'بوابة الموافقة', en: 'Approval gate' },
  'method.noGate': { ar: 'لا توجد بوابة موافقة في هذه المرحلة', en: 'No approval gate at this stage' },

  'projects.title': { ar: 'المشاريع', en: 'Projects' },
  'projects.lead': {
    ar: 'كل بطاقة تعرض المرحلة الحالية وحالة الأدلة. لا نعرض مشروعاً بمرحلة لا يدعمها سجل التحقق.',
    en: 'Each card shows the current stage and evidence state. No project is shown at a stage its verification record does not support.',
  },
  'projects.stage': { ar: 'المرحلة الحالية', en: 'Current stage' },
  'projects.platforms': { ar: 'المنصات', en: 'Platforms' },

  'about.title': { ar: 'عن الشركة', en: 'About the company' },
  'about.contactTitle': { ar: 'التواصل', en: 'Contact' },
  'about.email': { ar: 'البريد', en: 'Email' },
  'about.github': { ar: 'مستودعات الشركة', en: 'Company repositories' },
  'about.responseTarget': { ar: 'هدف الرد', en: 'Response target' },
  'about.hours': { ar: 'ساعة', en: 'hours' },

  'contact.title': { ar: 'ابدأ مشروعاً', en: 'Start a project' },
  'contact.lead': {
    ar: 'صف الهدف بوضوح. الطلب يدخل مباشرة إلى مرحلة الاستلام ويحصل على رقم متابعة.',
    en: 'Describe the outcome clearly. The request enters the intake stage directly and receives a tracking reference.',
  },
  'contact.name': { ar: 'الاسم', en: 'Name' },
  'contact.email': { ar: 'البريد الإلكتروني', en: 'Email address' },
  'contact.organization': { ar: 'الجهة أو الشركة (اختياري)', en: 'Organization (optional)' },
  'contact.service': { ar: 'نوع العمل', en: 'Type of work' },
  'contact.engagement': { ar: 'نمط التعاقد', en: 'Engagement model' },
  'contact.budget': { ar: 'نطاق الميزانية (اختياري)', en: 'Budget range (optional)' },
  'contact.timeline': { ar: 'الإطار الزمني (اختياري)', en: 'Timeline (optional)' },
  'contact.summary': { ar: 'وصف الهدف', en: 'Describe the outcome' },
  'contact.summaryHint': {
    ar: 'من المستخدم؟ ما الذي يجب أن يستطيع فعله؟ وكيف نعرف أن العمل نجح؟',
    en: 'Who is the user? What must they be able to do? How will we know it worked?',
  },
  'contact.submit': { ar: 'إرسال الطلب', en: 'Submit request' },
  'contact.submitting': { ar: 'جارٍ الإرسال…', en: 'Submitting…' },
  'contact.successTitle': { ar: 'تم استلام الطلب', en: 'Request received' },
  'contact.successBody': {
    ar: 'احتفظ برقم المتابعة. سنعود إليك بموجز أولي ضمن هدف الرد المعلن.',
    en: 'Keep the tracking reference. We will return an initial brief within the published response target.',
  },
  'contact.reference': { ar: 'رقم المتابعة', en: 'Tracking reference' },
  'contact.another': { ar: 'إرسال طلب آخر', en: 'Submit another request' },
  'contact.privacy': {
    ar: 'نستخدم بياناتك لمعالجة هذا الطلب فقط، ولا نشاركها مع أطراف أخرى.',
    en: 'Your details are used only to process this request and are not shared with third parties.',
  },
  'contact.fallbackTitle': { ar: 'الاستلام الآلي غير مفعّل بعد', en: 'Automated intake is not enabled yet' },
  'contact.fallbackBody': {
    ar: 'لم تُربط قاعدة بيانات الطلبات بهذه النسخة. أرسل الملخص نفسه على البريد وسيُسجَّل يدوياً بنفس المراحل.',
    en: 'The request database is not connected to this deployment. Send the same brief by email and it is recorded manually through the same stages.',
  },

  'account.title': { ar: 'حساب العميل', en: 'Client account' },
  'account.lead': {
    ar: 'تابع طلباتك ومراحلها والأدلة المرتبطة بها في مكان واحد.',
    en: 'Track your requests, their stages and the linked evidence in one place.',
  },
  'account.signIn': { ar: 'تسجيل الدخول', en: 'Sign in' },
  'account.signUp': { ar: 'إنشاء حساب', en: 'Create account' },
  'account.signOut': { ar: 'تسجيل الخروج', en: 'Sign out' },
  'account.password': { ar: 'كلمة المرور', en: 'Password' },
  'account.passwordHint': { ar: '١٢ حرفاً على الأقل', en: 'At least 12 characters' },
  'account.haveAccount': { ar: 'لديك حساب؟ سجّل الدخول', en: 'Already have an account? Sign in' },
  'account.needAccount': { ar: 'ليس لديك حساب؟ أنشئ واحداً', en: 'No account yet? Create one' },
  'account.requests': { ar: 'طلباتك', en: 'Your requests' },
  'account.noRequests': {
    ar: 'لا توجد طلبات مرتبطة بهذا الحساب بعد.',
    en: 'No requests are linked to this account yet.',
  },
  'account.startFirst': { ar: 'ابدأ طلبك الأول', en: 'Start your first request' },
  'account.submitted': { ar: 'تاريخ الإرسال', en: 'Submitted' },
  'account.checkEmail': {
    ar: 'تحقق من بريدك لتأكيد الحساب، ثم سجّل الدخول.',
    en: 'Check your email to confirm the account, then sign in.',
  },
  'account.disabledTitle': { ar: 'الحسابات غير مفعّلة في هذه النسخة', en: 'Accounts are not enabled on this deployment' },
  'account.disabledBody': {
    ar: 'لم تُربط خدمة الحسابات بعد. يمكنك إرسال طلب دون حساب، وستُربط طلباتك بحسابك عند تفعيل الخدمة.',
    en: 'The accounts service is not connected yet. You can submit a request without an account, and your requests will be linked once the service is enabled.',
  },

  'offline.title': { ar: 'لا يوجد اتصال', en: 'You are offline' },
  'offline.body': {
    ar: 'هذه النسخة محفوظة على جهازك. أعد الاتصال لعرض أحدث المحتوى والطلبات.',
    en: 'This copy is stored on your device. Reconnect to load the latest content and requests.',
  },
  'offline.retry': { ar: 'إعادة المحاولة', en: 'Retry' },

  'common.required': { ar: 'حقل مطلوب', en: 'Required field' },
  'common.error': { ar: 'تعذّر إتمام العملية', en: 'The operation could not be completed' },
  'common.backHome': { ar: 'العودة إلى الرئيسية', en: 'Back to home' },
  'common.select': { ar: 'اختر…', en: 'Select…' },
  'common.notFound': { ar: 'الصفحة غير موجودة', en: 'Page not found' },
  'common.notFoundBody': {
    ar: 'الرابط الذي فتحته غير صحيح أو أُزيل.',
    en: 'The link you opened is not valid or has been removed.',
  },

  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.evidence': {
    ar: 'حالات المشاريع على هذا الموقع تتبع لغة أدلة صريحة: مُتحقَّق، مُتحقَّق جزئياً، غير مُتحقَّق.',
    en: 'Project states on this site follow explicit evidence language: verified, partially verified, unverified.',
  },
} satisfies Dictionary

export type MessageKey = keyof typeof dictionary

export function t(key: MessageKey, locale: Locale): string {
  return dictionary[key][locale]
}

export function translator(locale: Locale) {
  return (key: MessageKey) => t(key, locale)
}
