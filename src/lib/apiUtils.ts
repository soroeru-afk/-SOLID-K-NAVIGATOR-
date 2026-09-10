/**
 * Utility functions for API endpoints with GitHub Pages / GAS proxy support
 */

export function getCustomApiUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('KNAV_CUSTOM_API_URL')?.trim() || '';
}

export function isGitHubPages(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes('github.io');
}

export function getPriceFetchUrl(code: string): string {
  const custom = getCustomApiUrl();
  if (custom) {
    return custom.includes('?') 
      ? `${custom}&code=${encodeURIComponent(code)}`
      : `${custom}?code=${encodeURIComponent(code)}`;
  }
  return `/api/fetch-price?code=${encodeURIComponent(code)}`;
}

export function getMarketNewsUrl(): string {
  const custom = getCustomApiUrl();
  if (custom) {
    return custom.includes('?')
      ? `${custom}&action=news`
      : `${custom}?action=news`;
  }
  return '/api/market-news';
}

export function getNewsDetailUrl(newsId: string, url: string): string {
  const custom = getCustomApiUrl();
  if (custom) {
    return custom.includes('?')
      ? `${custom}&action=news-detail&b=${encodeURIComponent(newsId)}&url=${encodeURIComponent(url)}`
      : `${custom}?action=news-detail&b=${encodeURIComponent(newsId)}&url=${encodeURIComponent(url)}`;
  }
  return `/api/news-detail?b=${encodeURIComponent(newsId)}&url=${encodeURIComponent(url)}`;
}

/**
 * Fetch with automatic timeout (default 8s) to prevent hanging
 */
export async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const isCustom = Boolean(getCustomApiUrl());
  const finalOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    credentials: isCustom ? 'omit' : 'include',
    cache: 'no-store',
  };

  try {
    const res = await fetch(url, finalOptions);
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
