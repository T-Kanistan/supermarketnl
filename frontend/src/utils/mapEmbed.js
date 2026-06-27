// Admins may paste many different things into the "Google Maps Embed" field:
//   1. The full "<iframe ... src="...">" embed snippet (Share -> Embed a map -> HTML)
//   2. A bare embed URL (https://www.google.com/maps/embed?pb=...)
//   3. A normal Maps link (Share -> link, /maps/place/..., short maps.app.goo.gl links)
//   4. A plain address / place name
//
// Only #1 and #2 can be shown inside an <iframe>. Normal Maps pages (#3) return
// X-Frame-Options and produce "www.google.com refused to connect". This module
// normalizes any of the above into a URL that is safe to use as an iframe src.

// Pull the src out of a pasted <iframe> snippet, otherwise return the trimmed value.
export const extractMapEmbedUrl = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const match = trimmed.match(/<iframe[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i);
  return match ? match[1].trim() : trimmed;
};

const buildEmbedQueryUrl = (query) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

const isEmbeddable = (url) =>
  /\/maps\/embed/i.test(url) || /[?&]output=embed/i.test(url);

// Returns a URL guaranteed to be embeddable in an <iframe>, or '' if nothing usable.
export const toEmbeddableMapUrl = (value, fallbackAddress = '') => {
  const raw = extractMapEmbedUrl(value);

  if (raw) {
    // Already a proper embed URL -> use as-is.
    if (isEmbeddable(raw)) return raw;

    // A Google Maps page link we must convert (it cannot be framed directly).
    const looksLikeUrl = /^https?:\/\//i.test(raw);
    const isGoogleMaps = /google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(raw);

    if (looksLikeUrl && isGoogleMaps) {
      // Try to pull coordinates like "@52.3702,4.8952" from the URL.
      const coords = raw.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (coords) return buildEmbedQueryUrl(`${coords[1]},${coords[2]}`);

      // Try to read a q / query parameter from the URL.
      try {
        const parsed = new URL(raw);
        const q = parsed.searchParams.get('q') || parsed.searchParams.get('query');
        if (q) return buildEmbedQueryUrl(q);
      } catch {
        /* not parseable as a URL */
      }

      // A /maps/place/<Name>/ style link -> use the place name segment.
      const place = raw.match(/\/maps\/place\/([^/@?]+)/i);
      if (place) return buildEmbedQueryUrl(decodeURIComponent(place[1].replace(/\+/g, ' ')));

      // Short links (maps.app.goo.gl) cannot be resolved client-side -> fall back.
      if (fallbackAddress) return buildEmbedQueryUrl(fallbackAddress);
      return '';
    }

    // Some other absolute URL (already not Google) -> trust it as a src.
    if (looksLikeUrl) return raw;

    // Plain text (address / place name).
    return buildEmbedQueryUrl(raw);
  }

  if (fallbackAddress) return buildEmbedQueryUrl(fallbackAddress);
  return '';
};

export default extractMapEmbedUrl;
