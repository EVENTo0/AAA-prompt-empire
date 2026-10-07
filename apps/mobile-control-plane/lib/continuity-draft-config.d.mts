export function continuityDraftConfig(env: Record<string, string | undefined>): {
  token?: string;
  repository?: string;
  writesEnabled: boolean;
  draftsEnabled: boolean;
};
