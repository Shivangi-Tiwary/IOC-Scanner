function defang(text) {
  return text
    .replace(/hxxp/gi, 'http')
    .replace(/\[\.\]/g, '.')
    .replace(/\(\.\)/g, '.')
    .replace(/\[:\]/g, ':');
}

function extractIOCs(rawText) {
  const text = defang(rawText);
  const iocs = {
    ips: new Set(),
    hashes: new Set(),
    domains: new Set()
  };

  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  
  const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
  const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
  const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;

  const domainRegex = /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g;

  const extract = (regex, targetSet) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      targetSet.add(match[0]);
    }
  };

  extract(ipRegex, iocs.ips);
  extract(md5Regex, iocs.hashes);
  extract(sha1Regex, iocs.hashes);
  extract(sha256Regex, iocs.hashes);
  
  let match;
  while ((match = domainRegex.exec(text)) !== null) {
    const d = match[0];
    if (!ipRegex.test(d)) {
      iocs.domains.add(d);
    }
    ipRegex.lastIndex = 0;
  }

  return {
    ips: Array.from(iocs.ips),
    hashes: Array.from(iocs.hashes),
    domains: Array.from(iocs.domains)
  };
}

// Function to filter out whitelisted items
async function filterWhitelisted(iocs, userId) {
  // If we want to check DB for whitelist
  const Whitelist = require('../models/whitelist');
  const userWhitelists = await Whitelist.find({ user: userId });
  const whitelistSet = new Set(userWhitelists.map(w => w.ioc));

  return {
    ips: iocs.ips.filter(ip => !whitelistSet.has(ip)),
    hashes: iocs.hashes.filter(h => !whitelistSet.has(h)),
    domains: iocs.domains.filter(d => !whitelistSet.has(d))
  };
}

module.exports = { extractIOCs, filterWhitelisted };
