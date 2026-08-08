import { redirect } from 'next/navigation'
import { isAuthorized } from '@/lib/auth'
import ControlPlane from '@/components/control-plane'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (!(await isAuthorized())) redirect('/login')
  return <ControlPlane />
}
