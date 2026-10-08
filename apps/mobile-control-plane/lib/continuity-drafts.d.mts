import type { ContinuitySnapshot } from './continuity-handoff.mjs'
export function createContinuityDraftHandler(options: {
  snapshot: ContinuitySnapshot;
  isAuthorized: () => boolean | Promise<boolean>;
  config: { token?: string; repository?: string; writesEnabled: boolean; draftsEnabled: boolean };
  fetchImpl?: typeof fetch;
}): (request: Request) => Promise<Response>;
