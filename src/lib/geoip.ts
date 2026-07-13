/**
 * GeoIP lookup for IP addresses.
 *
 * Returns country + city for a given IP, used to enrich login history events
 * so users can see "login from Cairo, EG" instead of just "login from 1.2.3.4".
 *
 * Implementation: Uses the MaxMind GeoLite2 free database (City) if available.
 * If the database file isn't present (e.g., in dev), returns null gracefully —
 * login events still record the IP, just without geo data.
 *
 * Setup (production):
 *   1. Sign up at https://www.maxmind.com/en/geolite2/signup (free)
 *   2. Download GeoLite2-City.mmdb and place at /app/data/GeoLite2-City.mmdb
 *   3. Update weekly via MaxMind's update script or a cron job
 *
 * Alternative: replace the implementation below with a paid API like
 * ipinfo.io (simpler, but costs money + adds latency).
 *
 * The DB lookup is sync (mmdb files are memory-mapped). We cache results in
 * memory for 1 hour per IP to avoid repeated lookups for the same user.
 */

import { existsSync } from 'fs'

type GeoData = {
  country: string | null // ISO country code, e.g., "EG"
  city: string | null // City name, e.g., "Cairo"
}

const NO_GEO: GeoData = { country: null, city: null }

// Path to the MaxMind GeoLite2-City database
const MMDB_PATH = process.env.GEOLITE2_CITY_DB || '/app/data/GeoLite2-City.mmdb'

// In-memory cache: IP → { geo, expiresAt }
const cache = new Map<string, { geo: GeoData; expiresAt: number }>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Lazy-load the mmdb reader (only if the file exists)
let mmdbReader: any = null
let mmdbLoaded = false

async function loadMmdb(): Promise<any> {
  if (mmdbLoaded) return mmdbReader
  mmdbLoaded = true
  if (!existsSync(MMDB_PATH)) {
    return null
  }
  try {
    // We use `maxmind` package if available; if not installed, return null.
    // This keeps the dependency optional — dev environments without the
    // mmdb file or package just skip geo enrichment.
    // The dynamic import + ts-ignore handles the case where `maxmind` isn't
    // in package.json (it's an optional production dep).
    // @ts-expect-error — maxmind is an optional dependency, may not be installed
    const maxmind = await import('maxmind').catch(() => null)
    if (!maxmind) return null
    mmdbReader = await maxmind.default.open(MMDB_PATH)
    return mmdbReader
  } catch (e) {
    console.error('[geoip] Failed to load mmdb:', e)
    return null
  }
}

/**
 * Look up geo data for an IP address.
 * Returns { country, city } or { country: null, city: null } if unavailable.
 *
 * @param ip IPv4 or IPv6 address. Pass 'unknown' or null for no lookup.
 */
export async function lookupGeoIp(ip: string | null | undefined): Promise<GeoData> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return NO_GEO
  }

  // Cache check
  const cached = cache.get(ip)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.geo
  }

  const reader = await loadMmdb()
  if (!reader) {
    return NO_GEO
  }

  try {
    const result = reader.get(ip)
    if (!result) {
      cache.set(ip, { geo: NO_GEO, expiresAt: Date.now() + CACHE_TTL_MS })
      return NO_GEO
    }

    const geo: GeoData = {
      country: result.country?.iso_code || null,
      city: result.city?.names?.en || result.city?.names?.ar || null,
    }

    cache.set(ip, { geo, expiresAt: Date.now() + CACHE_TTL_MS })
    return geo
  } catch {
    return NO_GEO
  }
}

/**
 * Clear the in-memory geo cache (useful for tests).
 */
export function clearGeoCache(): void {
  cache.clear()
}
