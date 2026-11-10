import type { ProxyOptions } from 'vite'

export function createProxy(env: Record<string, string>): Record<'/api' | '/s3', ProxyOptions> {
  const minio = new URL(env.VITE_MINIO_PUBLIC_URL || 'http://localhost:9000')
  return {
    '/api': { target: env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true },
    '/s3': {
      target: env.S3_PROXY_TARGET || 'http://localhost:9000',
      changeOrigin: false,
      headers: { host: minio.host },
      rewrite: path => path.replace(/^\/s3(?=\/)/, ''),
      configure(proxy) {
        proxy.on('proxyReq', request => {
          request.removeHeader('authorization')
          request.removeHeader('cookie')
        })
      },
    },
  }
}
