// Called only by the server route; never fall back to the dashboard/action credential.
export function continuityDraftConfig(env) {
  return {
    token: env.EVENTO_CONTINUITY_GITHUB_TOKEN,
    repository: env.EVENTO_CONTINUITY_TASK_REPOSITORY,
    writesEnabled: env.CONTROL_PLANE_ENABLE_WRITES === 'true',
    draftsEnabled: env.EVENTO_CONTINUITY_DRAFTS_ENABLED === 'true',
  }
}
