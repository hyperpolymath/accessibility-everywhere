import { Router } from 'express';
import { db } from '../server';

export const dashboardRouter = Router();

// GET /v1/dashboard/:orgId - Get organization dashboard
dashboardRouter.get('/:orgId', async (req, res, next) => {
  try {
    const { orgId } = req.params;

    // Get organization
    const org = await db.organizations.document(orgId);
    if (!org) {
      return res.status(404).json({
        error: {
          message: 'Organization not found',
          status: 404,
        },
      });
    }

    // Get organization sites
    const sites = await db.getOrganizationSites(orgId);

    // Calculate aggregate stats
    const totalSites = sites.length;
    const averageScore =
      totalSites > 0
        ? sites.reduce((sum, site) => sum + site.currentScore, 0) / totalSites
        : 0;

    // Count total violations across all sites
    let totalViolations = 0;
    for (const site of sites) {
      const cursor = await db.violations.byExample({
        siteKey: site._key,
        fixed: false,
      });
      const count = cursor.count ?? 0;
      totalViolations += count;
    }

    res.json({
      success: true,
      data: {
        organization: {
          name: org.name,
          tier: org.tier,
        },
        stats: {
          totalSites,
          averageScore: Math.round(averageScore),
          totalViolations,
        },
        sites: sites.map(site => ({
          domain: site.domain,
          url: site.url,
          score: site.currentScore,
          lastScanned: site.lastScanned,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});
