import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantIntegrationsWorkspace } from '@/components/merchant/MerchantIntegrationsWorkspace'
import type { MerchantAgentCredentialMetadata } from '@/modules/merchant/application/merchant-agent-credentials'

type CredentialView = Omit<MerchantAgentCredentialMetadata, 'createdAt' | 'lastUsedAt' | 'revokedAt'> & { createdAt: string; lastUsedAt: string | null; revokedAt: string | null }

function credential(overrides: Partial<CredentialView> = {}): CredentialView {
  return {
    id: 'credential-a', name: 'VisuTry Agent', status: 'ACTIVE', createdAt: '2026-09-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null,
    prefix: 'vt_live_0123456789abcdef', masked: 'vt_live_0123456789abcdef_••••••••', scopes: ['merchant:read', 'analytics:read'],
    ...overrides,
  }
}

const props = { locale: 'en', merchantId: 'merchant-a', endpoint: 'http://127.0.0.1:3001/api/mcp', skills: [{ name: 'VisuTry Merchant', purpose: 'Operate your workspace.', url: 'http://127.0.0.1:3001/skills/merchant', prompt: 'Help me.' }] }
const originalFetch = global.fetch

function response<T>(data: T, ok = true, error?: string) {
  return { ok, json: async () => ({ success: ok, data, error }) } as Response
}

describe('MerchantIntegrationsWorkspace', () => {
  beforeEach(() => { global.fetch = jest.fn() })
  afterEach(() => { global.fetch = originalFetch; jest.restoreAllMocks() })

  it('does not configured-state-label an unused active key as connected', () => {
    render(<MerchantIntegrationsWorkspace {...props} initialCredentials={[credential()]} />)
    expect(screen.getByText('Ready to connect')).toBeInTheDocument()
    expect(screen.getByText(/has not yet recorded successful use/)).toBeInTheDocument()
    expect(screen.getByText('Not used yet')).toBeInTheDocument()
    expect(screen.queryByText('Agent use verified')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create another key' })).toBeInTheDocument()
  })

  it('shows actual use evidence and keeps revoked credentials visible but inactive', () => {
    render(<MerchantIntegrationsWorkspace {...props} initialCredentials={[
      credential({ id: 'active-used', lastUsedAt: '2026-09-10T08:30:00.000Z' }),
      credential({ id: 'revoked', name: 'Old key', status: 'REVOKED', revokedAt: '2026-09-09T00:00:00.000Z' }),
    ]} />)
    expect(screen.getByText('Agent use verified')).toBeInTheDocument()
    expect(screen.getByText(/This records use, not a continuous connection/)).toBeInTheDocument()
    expect(screen.getByText(/Last used/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Old key' })).toBeInTheDocument()
    expect(screen.getByText('Revoked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rotate Old key' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Revoke Old key' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Access scopes (2)')).toHaveLength(2)
  })

  it('creates a key, shows its secret only in the one-time dialog, and clears it when dismissed', async () => {
    const testSecret = 'vt_live_0123456789abcdef_one_time_test_secret'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ credential: credential(), secret: testSecret }, true))
      .mockResolvedValueOnce(response({ credentials: [credential()] }, true))
    render(<MerchantIntegrationsWorkspace {...props} initialCredentials={[]} />)

    expect(screen.getByText('Not configured')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create Agent key' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(testSecret))).toBeInTheDocument()
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/merchant/merchant-a/agent-credentials', expect.objectContaining({ method: 'POST' }))

    fireEvent.click(screen.getByRole('button', { name: 'Close and hide key' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText(new RegExp(testSecret))).not.toBeInTheDocument()
    expect(screen.getByText('Ready to connect')).toBeInTheDocument()
    expect(screen.queryByText(testSecret)).not.toBeInTheDocument()
  })

  it('rotates only after explicit confirmation and discloses the replacement one time', async () => {
    const replacementSecret = 'vt_live_0123456789abcdef_replacement_test_secret'
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true)
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ credential: credential({ id: 'replacement' }), secret: replacementSecret }))
      .mockResolvedValueOnce(response({ credentials: [credential({ id: 'old', status: 'REVOKED', revokedAt: '2026-09-12T00:00:00.000Z' }), credential({ id: 'replacement' })] }))
    render(<MerchantIntegrationsWorkspace {...props} initialCredentials={[credential()]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rotate VisuTry Agent' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('immediately disables the current key'))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(replacementSecret))).toBeInTheDocument()
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/merchant/merchant-a/agent-credentials/credential-a/rotate', { method: 'POST' })
  })

  it('revoke requires explicit confirmation and then shows a revoked record', async () => {
    const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true)
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ credential: credential({ status: 'REVOKED', revokedAt: '2026-09-15T00:00:00.000Z' }) }))
      .mockResolvedValueOnce(response({ credentials: [credential({ status: 'REVOKED', revokedAt: '2026-09-15T00:00:00.000Z' })] }))
    render(<MerchantIntegrationsWorkspace {...props} initialCredentials={[credential()]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Revoke VisuTry Agent' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('will stop working immediately'))
    expect(await screen.findByText('Not configured')).toBeInTheDocument()
    expect(screen.getByText('Revoked')).toBeInTheDocument()
    expect(screen.getByText('“VisuTry Agent” was revoked.')).toBeInTheDocument()
  })

  it('resets one-time secret state when the selected Merchant changes', async () => {
    const testSecret = 'vt_live_0123456789abcdef_switch_secret'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(response({ credential: credential(), secret: testSecret }))
      .mockResolvedValueOnce(response({ credentials: [credential()] }))
    const KeyedWorkspace = ({ merchantId, initialCredentials }: { merchantId: string; initialCredentials: CredentialView[] }) => <MerchantIntegrationsWorkspace key={merchantId} {...props} merchantId={merchantId} initialCredentials={initialCredentials} />
    const view = render(<KeyedWorkspace merchantId="merchant-a" initialCredentials={[]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create Agent key' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    view.rerender(<KeyedWorkspace merchantId="merchant-b" initialCredentials={[]} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText(new RegExp(testSecret))).not.toBeInTheDocument()
    expect(screen.getByText('Not configured')).toBeInTheDocument()
  })
})
