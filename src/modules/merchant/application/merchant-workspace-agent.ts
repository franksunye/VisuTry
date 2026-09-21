import { headers } from 'next/headers'

export async function getMerchantWorkspaceAgentConfig() {
  const requestHeaders = headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || 'www.visutry.com'
  const protocol = requestHeaders.get('x-forwarded-proto') || 'https'
  const origin = `${protocol}://${host}`
  return {
    endpoint: `${origin}/api/mcp`,
    skills: [{
      name: 'VisuTry Merchant',
      purpose: 'Set up your Store, create Campaigns, and understand performance in one conversation.',
      url: `${origin}/skills/merchant`,
      prompt: 'Help me set up my VisuTry Store.',
    }],
  }
}

