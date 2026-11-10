import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { canUseGuestMock, mediaURL } from './client'

describe('API boundaries', () => {
  it('proxies MinIO without changing signed object path/query', () => {
    const signature = '/corpora/a%20b.png?X-Amz-Signature=abc&X-Amz-Credential=x%2Fy'
    expect(mediaURL(`http://localhost:9000${signature}`)).toBe(`/s3${signature}`)
    expect(mediaURL('/media/puskin.png')).toBe('/media/puskin.png')
    expect(mediaURL('')).toBe('')
    expect(mediaURL('https://example.com/a.png')).toBe('https://example.com/a.png')
  })
  it('allows offline/server fallback only for guests, never HTTP client errors or cancellation', () => {
    const offline = new AxiosError('offline', 'ERR_NETWORK')
    expect(canUseGuestMock(offline, false)).toBe(true)
    expect(canUseGuestMock(offline, true)).toBe(false)
    for (const status of [400, 401, 403, 404]) {
      expect(canUseGuestMock(new AxiosError('', '', undefined, undefined, { status } as never), false)).toBe(false)
    }
    expect(canUseGuestMock(new AxiosError('', '', undefined, undefined, { status: 503 } as never), false)).toBe(true)
    expect(canUseGuestMock(new AxiosError('', 'ERR_CANCELED'), false)).toBe(false)
    expect(canUseGuestMock(new Error('programming error'), false)).toBe(false)
  })
})
