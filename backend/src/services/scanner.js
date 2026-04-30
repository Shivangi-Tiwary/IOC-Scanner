const { checkVirusTotal, checkAbuseIPDB, checkShodan, sleep } = require('./apis');
const { calculateVerdict } = require('./verdictEngine');
const Scan = require('../models/scan');
const dns = require('dns').promises;

// VT rate limit: 4 req/min = 1 req per 15s
const VT_DELAY_MS = 15500;

async function reverseDNS(ip) {
  try {
    const hostnames = await dns.reverse(ip);
    return hostnames;
  } catch {
    return [];
  }
}

async function scanIOC(ioc, type, keys, options = {}) {
  const { noCache = false, onlyApis = null } = options;

  // Check cache
  if (!noCache) {
    const cached = await Scan.findOne({
      ioc,
      type,
      scannedAt: { $gte: new Date(Date.now() - 86400000) } // 24h TTL
    });
    if (cached) {
      return { ...cached.results, _cached: true };
    }
  }

  const results = { ioc, type, data: {}, enrichment: {} };
  const shouldQuery = (api) => !onlyApis || onlyApis.includes(api);

  // VirusTotal — all IOC types
  if (shouldQuery('vt') && keys.vt) {
    results.data.vt = await checkVirusTotal(ioc, type, keys.vt);
    // VT rate limit pause
    await sleep(VT_DELAY_MS);
  }

  // IP-only APIs
  if (type === 'ip') {
    if (shouldQuery('abuseipdb') && keys.abuseipdb) {
      results.data.abuseipdb = await checkAbuseIPDB(ioc, keys.abuseipdb);
    }
    if (shouldQuery('shodan') && keys.shodan) {
      results.data.shodan = await checkShodan(ioc, keys.shodan);
    }
    // Enrichment: Reverse DNS
    results.enrichment.reverseDns = await reverseDNS(ioc);
    // Enrichment from Shodan response
    if (results.data.shodan && !results.data.shodan.error) {
      results.enrichment.asn = results.data.shodan.org;
      results.enrichment.isp = results.data.shodan.isp;
      results.enrichment.os = results.data.shodan.os;
    }
    // Enrichment from AbuseIPDB
    if (results.data.abuseipdb && !results.data.abuseipdb.error) {
      results.enrichment.country = results.data.abuseipdb.countryCode;
    }
  }

  // Verdict
  const verdict = calculateVerdict(results.data);
  results.verdict = verdict.verdict;
  results.riskScore = verdict.riskScore;
  results.flagReasons = verdict.flagReasons;

  // Save to cache
  try {
    await Scan.findOneAndUpdate(
      { ioc, type },
      { ioc, type, results, scannedAt: new Date() },
      { upsert: true }
    );
  } catch (e) {
    console.error('Cache save error:', e.message);
  }

  return results;
}

module.exports = { scanIOC };
