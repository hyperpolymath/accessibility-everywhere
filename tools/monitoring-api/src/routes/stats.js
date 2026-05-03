import { Router } from 'express';
import { db } from '../server';

export const statsRouter = Router();

// GET /v1/stats - Get global statistics
statsRouter.get('/', async (req, res, next) => {
  try {
    const sitesCount = await db.sites.count();
    const scansCount = await db.scans.count();
    const violationsCount = await db.violations.count();

    const commonViolations = await db.getCommonViolations(5);

    res.json({
      success: true,
      data: {
        totalSites: sitesCount.count,
        totalScans: scansCount.count,
        totalViolations: violationsCount.count,
        commonViolations,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/stats/site/:siteKey - Get stats for a specific site
statsRouter.get('/site/:siteKey', async (req, res, next) => {
  try {
    const { siteKey } = req.params;

    const site = await db.sites.document(siteKey);
    const scans = await db.getRecentScansForSite(siteKey, 30);
    const trend = await db.getSiteViolationTrend(siteKey, 30);

    res.json({
      success: true,
      data: {
        site,
        recentScans: scans,
        trend,
      },
    });
  } catch (error) {
    next(error);
  }
});
