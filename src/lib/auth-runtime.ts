import type { NextAuthOptions } from 'next-auth'

type AuthModule = { authOptions: NextAuthOptions }

const runtimeAuth = (process.env.CLOUDFLARE_BUILD === '1'
  ? require('./auth-cloudflare')
  : require('./auth')) as AuthModule

export const authOptions = runtimeAuth.authOptions
