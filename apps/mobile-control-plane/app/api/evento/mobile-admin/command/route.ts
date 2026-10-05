import { NextRequest, NextResponse } from 'next/server'
import { authorizeMobileAdmin, mobileCommand } from '@/lib/mobile-admin'

export async function POST(request: NextRequest) {
  if (!authorizeMobileAdmin(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json(mobileCommand(await request.json()))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create mobile command plan' },
      { status: 400 },
    )
  }
}
