import { NextRequest, NextResponse } from 'next/server'
import { resolveDecisionResultAsset } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string; assetRef: string } },
) {
  const result = await resolveDecisionResultAsset({ token: params.token, assetRef: params.assetRef })
  if (!result) return NextResponse.json({ success: false, error: 'Decision Result asset unavailable.' }, { status: 404 })
  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'private, no-store',
      ...(result.expiresAt ? { Expires: result.expiresAt.toUTCString() } : {}),
    },
  })
}
