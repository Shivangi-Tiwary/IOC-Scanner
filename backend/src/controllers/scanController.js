const { extractIOCs, filterWhitelisted } = require('../utils/parser');
const { scanIOC } = require('../services/scanner');
const ScanReport = require('../models/scanReport');
const Scan = require('../models/scan');

// SSE-based scan with live progress
const scanTextSSE = async (req, res) => {
  try {
    const { text, dryRun, noCache, onlyApis } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    // Get user's API keys
    const userKeys = req.user.keys || {};
    const keys = {
      vt: userKeys.vt || process.env.VT_API_KEY || '',
      abuseipdb: userKeys.abuseipdb || process.env.ABUSEIPDB_API_KEY || '',
      shodan: userKeys.shodan || process.env.SHODAN_API_KEY || ''
    };

    // Parse IOCs
    let iocs = extractIOCs(text);

    // Filter whitelisted
    iocs = await filterWhitelisted(iocs, req.user._id);

    // Build flat list
    const allIOCs = [
      ...iocs.ips.map(v => ({ ioc: v, type: 'ip' })),
      ...iocs.hashes.map(v => ({ ioc: v, type: 'hash' })),
      ...iocs.domains.map(v => ({ ioc: v, type: 'domain' }))
    ];

    // Dry run — return parsed IOCs without querying
    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        count: allIOCs.length,
        parsed: allIOCs
      });
    }

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const total = allIOCs.length;
    const results = [];
    const summary = { total, malicious: 0, suspicious: 0, clean: 0 };

    // Send initial event
    res.write(`data: ${JSON.stringify({ type: 'start', total })}\n\n`);

    // Parse onlyApis
    const parsedOnlyApis = onlyApis ? onlyApis.split(',').map(s => s.trim()) : null;

    for (let i = 0; i < allIOCs.length; i++) {
      const { ioc, type } = allIOCs[i];

      // Send progress event
      res.write(`data: ${JSON.stringify({
        type: 'progress',
        current: i + 1,
        total,
        ioc,
        iocType: type,
        status: 'scanning'
      })}\n\n`);

      try {
        const result = await scanIOC(ioc, type, keys, {
          noCache: noCache || false,
          onlyApis: parsedOnlyApis
        });
        results.push(result);

        // Update summary
        if (result.verdict === 'MALICIOUS') summary.malicious++;
        else if (result.verdict === 'SUSPICIOUS') summary.suspicious++;
        else if (result.verdict === 'CLEAN') summary.clean++;

        // Send result event
        res.write(`data: ${JSON.stringify({
          type: 'result',
          current: i + 1,
          total,
          ioc,
          iocType: type,
          status: 'done',
          result
        })}\n\n`);
      } catch (err) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          current: i + 1,
          total,
          ioc,
          iocType: type,
          status: 'error',
          error: err.message
        })}\n\n`);
      }
    }

    // Save scan report for history
    try {
      await ScanReport.create({
        user: req.user._id,
        summary,
        results: results.map(r => ({
          ioc: r.ioc,
          type: r.type,
          verdict: r.verdict || 'UNKNOWN',
          riskScore: r.riskScore || 0,
          flagReasons: r.flagReasons || [],
          data: r.data
        }))
      });
    } catch (e) {
      console.error('Failed to save scan report:', e.message);
    }

    // Send done
    res.write(`data: ${JSON.stringify({ type: 'done', summary, count: results.length })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Scan Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'fatal', error: error.message })}\n\n`);
      res.end();
    }
  }
};

// Get scan history
const getScanHistory = async (req, res) => {
  try {
    const reports = await ScanReport.find({ user: req.user._id })
      .sort({ scannedAt: -1 })
      .limit(50)
      .select('summary scannedAt results');
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single scan report
const getScanReport = async (req, res) => {
  try {
    const report = await ScanReport.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Diff two scan reports
const diffReports = async (req, res) => {
  try {
    const { oldId, newId } = req.params;
    const [oldReport, newReport] = await Promise.all([
      ScanReport.findOne({ _id: oldId, user: req.user._id }),
      ScanReport.findOne({ _id: newId, user: req.user._id })
    ]);
    if (!oldReport || !newReport) return res.status(404).json({ error: 'Report(s) not found' });

    const oldMap = {};
    oldReport.results.forEach(r => { oldMap[r.ioc] = r; });

    const diff = newReport.results.map(newItem => {
      const item = typeof newItem.toObject === 'function' ? newItem.toObject() : { ...newItem };
      const oldItem = oldMap[newItem.ioc];
      if (!oldItem) {
        return { ...item, diffStatus: 'NEW' };
      }
      if (oldItem.verdict !== newItem.verdict || oldItem.riskScore !== newItem.riskScore) {
        return {
          ...item,
          diffStatus: 'CHANGED',
          previousVerdict: oldItem.verdict,
          previousRiskScore: oldItem.riskScore
        };
      }
      return { ...item, diffStatus: 'UNCHANGED' };
    });

    // IOCs removed in new scan
    const newIOCs = new Set(newReport.results.map(r => r.ioc));
    oldReport.results.forEach(r => {
      if (!newIOCs.has(r.ioc)) {
        const item = typeof r.toObject === 'function' ? r.toObject() : { ...r };
        diff.push({ ...item, diffStatus: 'REMOVED' });
      }
    });

    res.json({ success: true, diff, oldSummary: oldReport.summary, newSummary: newReport.summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear cache
const clearCache = async (req, res) => {
  try {
    await Scan.deleteMany({});
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { scanTextSSE, getScanHistory, getScanReport, diffReports, clearCache };
