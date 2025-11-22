import { Router } from 'express';
import { db } from '../server';

export const violationsRouter = Router();

// POST /v1/violations - Report a violation (from browser extension)
violationsRouter.post('/', async (req, res, next) => {
  try {
    const { url, violation, timestamp, userAgent } = req.body;

    if (!url || !violation) {
      return res.status(400).json({
        error: {
          message: 'URL and violation are required',
          status: 400,
        },
      });
    }

    // Get or create site
    let site = await db.getSiteByUrl(url);
    if (!site) {
      const urlObj = new URL(url);
      const siteDoc = await db.sites.save({
        url,
        domain: urlObj.hostname,
        firstScanned: new Date(),
        lastScanned: new Date(),
        scanCount: 0,
        currentScore: 0,
        status: 'active',
      });
      site = { _key: siteDoc._key } as any;
    }

    // Store violation
    await db.violations.save({
      siteKey: site._key,
      scanKey: '', // No scan key for direct reports
      wcagCriterion: violation.wcagCriterion || 'unknown',
      wcagLevel: violation.wcagLevel || 'AA',
      impact: violation.impact || 'moderate',
      description: violation.description || '',
      helpUrl: violation.helpUrl || '',
      selector: violation.selector || '',
      html: violation.html || '',
      timestamp: new Date(timestamp || Date.now()),
      fixed: false,
    });

    res.json({
      success: true,
      message: 'Violation reported successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/violations/common - Get most common violations
violationsRouter.get('/common', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const violations = await db.getCommonViolations(limit);

    res.json({
      success: true,
      data: violations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/violations/site/:siteKey - Get violations for a site
violationsRouter.get('/site/:siteKey', async (req, res, next) => {
  try {
    const { siteKey } = req.params;
    const fixed = req.query.fixed === 'true';

    const violations = await db.violations.byExample({
      siteKey,
      fixed,
    }).then(cursor => cursor.all());

    res.json({
      success: true,
      data: violations,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /v1/violations/:violationId/fixed - Mark violation as fixed
violationsRouter.patch('/:violationId/fixed', async (req, res, next) => {
  try {
    const { violationId } = req.params;

    await db.violations.update(violationId, {
      fixed: true,
      fixedAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Violation marked as fixed',
    });
  } catch (error) {
    next(error);
  }
});
