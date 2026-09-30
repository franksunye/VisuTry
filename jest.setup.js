import '@testing-library/jest-dom'

if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = require('node:util').structuredClone
}

if (typeof global.ReadableStream === 'undefined') {
  const {
    ReadableStream,
    TransformStream,
    WritableStream,
    TextEncoderStream,
    TextDecoderStream,
  } = require('node:stream/web')
  Object.assign(global, {
    ReadableStream,
    TransformStream,
    WritableStream,
    TextEncoderStream,
    TextDecoderStream,
  })
}

// Next 16's cache/request modules require the Fetch API during module load.
// jsdom does not expose Node 22's Fetch globals, so bridge the same runtime
// primitives used by the application into the Jest environment.
if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers, FormData, Blob, File, fetch } = require('undici')
  Object.assign(global, {
    Request: global.Request ?? Request,
    Response: global.Response ?? Response,
    Headers: global.Headers ?? Headers,
    FormData: global.FormData ?? FormData,
    Blob: global.Blob ?? Blob,
    File: global.File ?? File,
    fetch: global.fetch ?? fetch,
  })
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return { locale: 'en' }
  },
}))

// Mock environment variables for tests
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'
process.env.ENABLE_MOCKS = 'true'
