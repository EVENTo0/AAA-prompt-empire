import { evidenceLabel, type EvidenceState } from '@/lib/content'
import type { Locale } from '@/lib/i18n'

const className: Record<EvidenceState, string> = {
  VERIFIED: 'verified',
  'PARTIALLY VERIFIED': 'partial',
  UNVERIFIED: 'unverified',
  BLOCKED: 'blocked',
}

export default function EvidenceBadge({ state, locale }: { state: EvidenceState; locale: Locale }) {
  return <span className={`evidence ${className[state]}`}>{evidenceLabel[state][locale]}</span>
}
