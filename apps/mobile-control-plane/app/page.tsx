import { redirect } from 'next/navigation'
import { isAuthorized } from '@/lib/auth'
import ControlPlane from '@/components/control-plane'
import ProjectRegistryPanel from '@/components/project-registry'
import EventoCommandCenter from '@/components/evento-command-center'
import WorkspaceManagerPanel from '@/components/workspace-manager'
import ContinuityPanel from '@/components/continuity-panel'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (!(await isAuthorized())) redirect('/login')
  return <>
    <ContinuityPanel />
    <EventoCommandCenter />
    <WorkspaceManagerPanel />
    <ControlPlane />
    <ProjectRegistryPanel />
  </>
}
