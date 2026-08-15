import { ReactNode } from 'react'
import { getMessages } from 'next-intl/server'

type MessageTree = Record<string, unknown>

function readPath(messages: MessageTree, path: string[]): unknown {
  return path.reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined
    return (value as MessageTree)[key]
  }, messages)
}

function writePath(target: MessageTree, path: string[], value: unknown): void {
  let cursor = target
  path.forEach((key, index) => {
    if (index === path.length - 1) {
      cursor[key] = value
      return
    }
    const next = cursor[key]
    if (!next || typeof next !== 'object') cursor[key] = {}
    cursor = cursor[key] as MessageTree
  })
}

export function pickMessages(messages: MessageTree, namespaces: readonly string[]): MessageTree {
  const selected: MessageTree = {}
  namespaces.forEach((namespace) => {
    const path = namespace.split('.')
    const value = readPath(messages, path)
    if (value !== undefined) writePath(selected, path, value)
  })
  return selected
}

export async function RouteMessagesProvider({
  namespaces,
  children,
}: {
  namespaces: readonly string[]
  children: ReactNode
}) {
  // Some isolated page tests mock only the server translation helpers. In
  // that environment there is no client message context to add, so preserve
  // the page tree; production always provides getMessages.
  if (typeof getMessages !== 'function') return <>{children}</>
  const messages = await getMessages()
  const selectedMessages = pickMessages(messages as MessageTree, namespaces)
  const { NextIntlClientProvider } = await import('next-intl')
  return (
    <NextIntlClientProvider messages={selectedMessages}>
      {children}
    </NextIntlClientProvider>
  )
}
