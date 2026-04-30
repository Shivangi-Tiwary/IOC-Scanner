const axios = require('axios');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkVirusTotal(ioc, type, key) {
  if (!key) return { error: 'No VT API key provided' };
  try {
    let url = '';
    if (type === 'ip') url = `https://www.virustotal.com/api/v3/ip_addresses/${ioc}`;
    else if (type === 'domain') url = `https://www.virustotal.com/api/v3/domains/${ioc}`;
    else if (type === 'hash') url = `https://www.virustotal.com/api/v3/files/${ioc}`;

    const res = await axios.get(url, {
      headers: { 'x-apikey': key }
    });
    
    const stats = res.data.data.attributes.last_analysis_stats;
    return {
      vendor: 'VirusTotal',
      malicious: stats.malicious,
      suspicious: stats.suspicious,
      harmless: stats.harmless,
      undetected: stats.undetected,
      link: `https://www.virustotal.com/gui/${type === 'hash' ? 'file' : type === 'ip' ? 'ip-address' : 'domain'}/${ioc}`
    };
  } catch (error) {
    if (error.response && error.response.status === 404) return { vendor: 'VirusTotal', status: 'Not found' };
    if (error.response && error.response.status === 429) return { vendor: 'VirusTotal', status: 'Rate limited' };
    return { vendor: 'VirusTotal', error: error.message };
  }
}

async function checkAbuseIPDB(ip, key) {
  if (!key) return { error: 'No AbuseIPDB key provided' };
  try {
    const res = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      params: { ipAddress: ip, maxAgeInDays: 90 },
      headers: { 'Key': key, 'Accept': 'application/json' }
    });
    
    const data = res.data.data;
    return {
      vendor: 'AbuseIPDB',
      confidenceScore: data.abuseConfidenceScore,
      totalReports: data.totalReports,
      countryCode: data.countryCode,
      domain: data.domain
    };
  } catch (error) {
    if (error.response && error.response.status === 429) return { vendor: 'AbuseIPDB', status: 'Rate limited' };
    return { vendor: 'AbuseIPDB', error: error.message };
  }
}

async function checkShodan(ip, key) {
  if (!key) return { error: 'No Shodan key provided' };
  try {
    const res = await axios.get(`https://api.shodan.io/shodan/host/${ip}?key=${key}`);
    return {
      vendor: 'Shodan',
      ports: res.data.ports,
      os: res.data.os,
      isp: res.data.isp,
      org: res.data.org
    };
  } catch (error) {
    if (error.response && error.response.status === 404) return { vendor: 'Shodan', status: 'No information available' };
    if (error.response && error.response.status === 403) return { vendor: 'Shodan', status: 'Invalid API key or access denied' };
    return { vendor: 'Shodan', error: error.message };
  }
}

module.exports = { checkVirusTotal, checkAbuseIPDB, checkShodan, sleep };
