// One bounded comparison. No redirects, retries, cookies, alternate UA or product API requests.
import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { writeFileSync } from 'node:fs'
const hostname = 'goodr.com'
const answers = await lookup(hostname, { all: true, verbatim: true })
const selected = [...answers].sort((a,b) => `${a.family}:${a.address}`.localeCompare(`${b.family}:${b.address}`))[0]
const results = []
for (const mode of ['hostname', 'pinned']) {
  results.push(await new Promise(resolve => {
    const result = { mode, dns: answers, selected, proxyConfigured: Boolean(process.env.HTTPS_PROXY || process.env.HTTP_PROXY), transport: 'node:https; agent:false; direct', tlsVerified: false }
    const req = request({ hostname: mode === 'pinned' ? selected.address : hostname, ...(mode === 'pinned' ? {family:selected.family} : {}), servername:hostname, rejectUnauthorized:true, port:443, path:'/products/hooked-on-onyx', method:'GET', headers:{Accept:'text/html, application/xhtml+xml;q=0.9, application/json;q=0.8, text/javascript;q=0.8',Host:hostname},agent:false }, res => {
      result.status = res.statusCode
      result.headers = Object.fromEntries(['server','content-type','content-length','via','cf-ray','cf-mitigated','x-cache','powered-by','location'].filter(k => res.headers[k]).map(k => [k,res.headers[k]]))
      result.remoteAddress = res.socket.remoteAddress
      result.remotePort = res.socket.remotePort
      result.tlsVerified = res.socket.authorized
      result.tlsProtocol = res.socket.getProtocol()
      let bytes = 0
      res.on('data', chunk => { bytes += chunk.length; if(bytes > 524288) res.destroy() })
      res.on('close', () => { result.observedBytes = bytes; resolve(result) })
      res.on('error', e => { result.responseError = e.code; resolve(result) })
    })
    req.setTimeout(3000, () => req.destroy(Object.assign(new Error('timeout'),{code:'SOURCE_TIMEOUT'})))
    const deadline = setTimeout(() => req.destroy(Object.assign(new Error('deadline'),{code:'TOTAL_TIMEOUT'})), 10000)
    req.on('close', () => clearTimeout(deadline))
    req.on('error', e => { result.error = e.code; resolve(result) })
    req.end()
  }))
}
const report = {target:`https://${hostname}/products/hooked-on-onyx`, timestamp:new Date().toISOString(), results}
writeFileSync('c3-d3-diagnostics.json', JSON.stringify(report,null,2))
console.log(JSON.stringify(report,null,2))
