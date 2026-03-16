/**
 * Intercepta o fetch nativo para simular respostas dos gateways em testes.
 * Apenas URLs dos gateways (porta 3001/3002) são interceptadas.
 * Requisições da API (porta 3333) passam normalmente.
 */

type FetchFn = typeof fetch

let originalFetch: FetchFn | undefined

function isGatewayUrl(url: RequestInfo | URL): boolean {
  const str = String(url)
  return str.includes(':3001') || str.includes(':3002') || str.includes('gateways-mock')
}

function mockFetch(handler: (url: string, options?: RequestInit) => Promise<Response>) {
  originalFetch = global.fetch
  global.fetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    if (isGatewayUrl(url)) return handler(String(url), options)
    return originalFetch!(url, options)
  }
}

export function restoreGatewayFetch() {
  if (originalFetch) {
    global.fetch = originalFetch
    originalFetch = undefined
  }
}

/** Ambos os gateways retornam sucesso */
export function mockBothGatewaysSuccess() {
  mockFetch(async (url) => {
    if (url.includes('/login')) {
      return new Response(JSON.stringify({ token: 'mock-bearer-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('/transactions') || url.includes('/transacoes')) {
      return new Response(JSON.stringify({ id: 'mock-external-id-001' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (url.includes('charge_back') || url.includes('reembolso')) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Not found', { status: 404 })
  })
}

/** Gateway 1 falha, Gateway 2 responde com sucesso (testa o fallback) */
export function mockGateway1FailsGateway2Succeeds() {
  mockFetch(async (url) => {
    if (url.includes(':3001') || url.includes('gateways-mock:3001')) {
      throw new Error('Gateway 1: connection refused (simulado em teste)')
    }
    if (url.includes('/transacoes')) {
      return new Response(JSON.stringify({ id: 'gw2-fallback-id-002' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('Not found', { status: 404 })
  })
}

/** Todos os gateways falham */
export function mockAllGatewaysFail() {
  mockFetch(async () => {
    throw new Error('Todos os gateways falharam (simulado em teste)')
  })
}
