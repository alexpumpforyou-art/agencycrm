import { NextResponse } from 'next/server';

// Публичные API, доступные с внешних сайтов
const PUBLIC_API_PATHS = ['/api/leads/webhook', '/api/clicks'];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isPublicApi = PUBLIC_API_PATHS.some(p => pathname.startsWith(p));

  // Обработка preflight OPTIONS для публичных API
  if (isPublicApi && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  // Добавляем CORS-заголовки к ответам публичных API
  if (isPublicApi) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
