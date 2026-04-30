function calculateVerdict(data) {
  let riskScore = 0;
  const flagReasons = [];

  // VirusTotal weighting (0-100 scale, heavy focus on malicious count)
  if (data.vt && data.vt.malicious !== undefined) {
    const vt = data.vt;
    if (vt.malicious > 0) {
      riskScore += (vt.malicious * 5); // 5 points per malicious engine
      flagReasons.push(`VT: ${vt.malicious} engines detected`);
    }
  }

  // AbuseIPDB weighting
  if (data.abuseipdb && data.abuseipdb.confidenceScore) {
    const score = data.abuseipdb.confidenceScore;
    if (score > 0) {
      riskScore += Math.floor(score * 0.5); // Max 50 points from AbuseIPDB
      flagReasons.push(`AbuseIPDB: ${score}% confidence`);
    }
  }

  // Shodan weighting
  if (data.shodan && data.shodan.ports) {
    const dangerousPorts = [21, 22, 23, 3389, 4444, 445];
    const openDangerous = data.shodan.ports.filter(p => dangerousPorts.includes(p));
    if (openDangerous.length > 0) {
      riskScore += (openDangerous.length * 5); // 5 points per dangerous port
      flagReasons.push(`Shodan: Dangerous ports open [${openDangerous.join(',')}]`);
    }
  }

  // Normalize max score
  if (riskScore > 100) riskScore = 100;

  let verdict = 'UNKNOWN';
  if (riskScore === 0 && (data.vt || data.abuseipdb || data.shodan)) {
    verdict = 'CLEAN';
  } else if (riskScore > 0 && riskScore < 40) {
    verdict = 'SUSPICIOUS';
  } else if (riskScore >= 40) {
    verdict = 'MALICIOUS';
  }

  return { riskScore, verdict, flagReasons };
}

module.exports = { calculateVerdict };
