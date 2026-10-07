export type ContinuityProject = {
  id: string; name: string; repository: string | null; source_ref: string | null;
  contract_ref: string | null; source_pack_ids: string[]; role: string;
  evidence_state: string; open_gates: string[]; next_action: string;
  evidence: { kind: string; url?: string; name?: string; library_file_id?: string; verdict: string; ref?: string }[];
}
export type ContinuitySnapshot = {
  snapshot_id: string; revision: number; observed_at: string;
  policy: { external_execution_enabled: boolean; production_release_enabled: boolean };
  authority: Record<string, string>; projects: ContinuityProject[];
}
export function createContinuityHandoff(snapshot: ContinuitySnapshot, projectId: string, adapter: string, taskId: string): {
  task: Record<string, unknown>; context: Record<string, unknown>; prompt: string; execution: 'handoff-only';
};
