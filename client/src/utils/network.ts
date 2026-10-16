// Utility to resolve the best reachable host address for mobile QR codes

let cachedSuggestedOrigin: string | null = null;

export async function getSuggestedQrOrigin(): Promise<string> {
  if (cachedSuggestedOrigin) {
    return cachedSuggestedOrigin;
  }

  // If already accessing via LAN IP or public domain, use current origin
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.hostname !== '::1'
  ) {
    cachedSuggestedOrigin = window.location.origin;
    return cachedSuggestedOrigin;
  }

  // If accessed from localhost, query backend for its local Wi-Fi / LAN IP
  try {
    const res = await fetch('/api/system/network-info');
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.suggestedOrigin) {
        cachedSuggestedOrigin = data.data.suggestedOrigin;
        return cachedSuggestedOrigin!;
      }
    }
  } catch (err) {
    console.warn('Could not auto-fetch LAN IP from backend:', err);
  }

  // Fallback to current origin
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
}
