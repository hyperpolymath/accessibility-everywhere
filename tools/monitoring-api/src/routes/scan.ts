import { Router } from 'express';
import Joi from 'joi';
import { db, scanner } from '../server';

export const scanRouter = Router();

// Validation schema
const scanSchema = Joi.object({
  url: Joi.string().uri().required(),
  wcagLevel: Joi.string().valid('A', 'AA', 'AAA').default('AA'),
  screenshot: Joi.boolean().default(false),
});

// POST /v1/scan - Scan a URL for accessibility issues
scanRouter.post('/', async (req, res, next) => {
  try {
    // Validate request
    const { error, value } = scanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          status: 400,
        },
      });
    }

    const { url, wcagLevel, screenshot } = value;

    // Run scan
    const result = await scanner.scan({
      url,
      wcagLevel,
      screenshot,
    });

    // Extract domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Store in database
    let site = await db.getSiteByUrl(url);
    let siteKey: string;

    if (!site) {
      // Create new site
      const siteDoc = await db.sites.save({
        url,
        domain,
        firstScanned: new Date(),
        lastScanned: new Date(),
        scanCount: 1,
        currentScore: result.score,
        status: 'active',
      } as any);
      siteKey = siteDoc._key;
    } else {
      // Update existing site
      siteKey = site._key;
      await db.sites.update(site._key, {
        lastScanned: new Date(),
        scanCount: (site.scanCount || 0) + 1,
        previousScore: site.currentScore,
        currentScore: result.score,
      });
    }

    // Store scan
    const scanDoc = await db.scans.save({
      siteKey,
      timestamp: result.timestamp,
      score: result.score,
      violations: result.violations.length,
      passes: result.passes.length,
      incomplete: result.incomplete.length,
      url,
      wcagLevel,
      duration: result.duration,
      userAgent: result.metadata.userAgent,
    } as any);

    // Store violations
    for (const violation of result.violations) {
      for (const node of violation.nodes) {
        await db.violations.save({
          scanKey: scanDoc._key,
          siteKey,
          wcagCriterion: violation.wcag[0] || 'unknown',
          wcagLevel: wcagLevel,
          impact: violation.impact,
          description: violation.description,
          helpUrl: violation.helpUrl,
          selector: node.target.join(' > '),
          html: node.html,
          timestamp: new Date(),
          fixed: false,
        } as any);
      }
    }

    // Return results
    res.json({
      success: true,
      data: {
        url,
        scanId: scanDoc._key,
        score: result.score,
        violations: result.violations.length,
        passes: result.passes.length,
        incomplete: result.incomplete.length,
        wcagLevel,
        timestamp: result.timestamp,
        details: {
          violations: result.violations,
          passes: result.passes,
          incomplete: result.incomplete,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/scan/:scanId - Get scan results by ID
scanRouter.get('/:scanId', async (req, res, next) => {
  try {
    const { scanId } = req.params;

    const scan = await db.scans.document(scanId);
    if (!scan) {
      return res.status(404).json({
        error: {
          message: 'Scan not found',
          status: 404,
        },
      });
    }

    const violations = await db.getViolationsForScan(scanId);

    res.json({
      success: true,
      data: {
        scan,
        violations,
      },
    });
  } catch (error) {
    next(error);
  }
});
