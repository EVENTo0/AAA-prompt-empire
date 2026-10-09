export type FailureCode = 'required' | 'too_short' | 'too_long' | 'invalid'
export type ValidationFailure = { field: string; code: FailureCode }

export type IntakeFields = {
  name: string
  email: string
  organization: string
  serviceId: string
  engagementId: string
  budget: string
  timeline: string
  summary: string
  locale: 'ar' | 'en'
}

export declare const limits: {
  name: { min: number; max: number }
  email: { max: number }
  organization: { max: number }
  budget: { max: number }
  timeline: { max: number }
  summary: { min: number; max: number }
}

export declare const REFERENCE_RE: RegExp

export declare function validateFields(
  payload: unknown,
  allowed: { serviceIds: string[]; engagementIds: string[] },
): { fields: IntakeFields; failures: ValidationFailure[] }

export declare function createReference(now: Date, uuid: string): string
