import { AgentScopeError, type MerchantAgentScope } from './agent-credentials'

export type HumanMerchantActor = {
  actorType: 'HUMAN'
  actorId: string
  merchantId: string
  membershipId?: string
}

export type AgentMerchantActor = {
  actorType: 'AGENT_CREDENTIAL'
  actorId: string
  merchantId: string
  scopes: MerchantAgentScope[]
}

export type SystemMerchantActor = {
  actorType: 'SYSTEM'
  actorId: string
  merchantId: string
}

export type MerchantActorContext = HumanMerchantActor | AgentMerchantActor | SystemMerchantActor

export function requireAgentScope(actor: MerchantActorContext, scope: MerchantAgentScope): void {
  if (actor.actorType === 'AGENT_CREDENTIAL' && !actor.scopes.includes(scope)) {
    throw new AgentScopeError(scope)
  }
}

export function isAgentMerchantActor(actor: MerchantActorContext): actor is AgentMerchantActor {
  return actor.actorType === 'AGENT_CREDENTIAL'
}
