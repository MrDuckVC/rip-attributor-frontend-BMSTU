import { describe, expect, it } from 'vitest'
import { createProxy } from '../../proxy'

describe('same origin proxy', () => {
  it('keeps API prefix, removes only media prefix and restores signed Host', () => {
    const proxy = createProxy({ S3_PROXY_TARGET: 'http://host.docker.internal:9000', VITE_MINIO_PUBLIC_URL: 'http://localhost:9000' })
    expect(proxy['/api'].target).toBe('http://localhost:8080')
    expect(proxy['/s3'].rewrite?.('/s3/corpora/a.png?X-Amz-Signature=x%2Fy')).toBe('/corpora/a.png?X-Amz-Signature=x%2Fy')
    expect(proxy['/s3'].headers?.host).toBe('localhost:9000')
  })
})
