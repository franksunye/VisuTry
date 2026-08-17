declare module '*.open-next/worker.js' {
  const app: {
    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>
  }

  export default app
}
