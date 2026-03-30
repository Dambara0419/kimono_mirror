export const config = {
  matcher: '/(.*)',
}

export default function middleware(request) {
  const basicAuth = request.headers.get('authorization')

  if (basicAuth) {
    const [scheme, credentials] = basicAuth.split(' ')
    if (scheme === 'Basic' && credentials) {
      const decoded = atob(credentials)
      const colonIndex = decoded.indexOf(':')
      const user = decoded.substring(0, colonIndex)
      const pass = decoded.substring(colonIndex + 1)

      if (
        user === process.env.BASIC_AUTH_USER &&
        pass === process.env.BASIC_AUTH_PASS
      ) {
        return
      }
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Kimono Mirror"',
    },
  })
}
