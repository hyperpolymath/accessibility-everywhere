import { Router } from 'express';
import { db } from '../server';

export const leaderboardRouter = Router();

// GET /v1/leaderboard - Get top sites by accessibility score
leaderboardRouter.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const sites = await db.getTopSites(limit);

    const leaderboard = sites.map((site, index) => ({
      rank: index + 1,
      domain: site.domain,
      url: site.url,
      score: site.currentScore,
      violations: site.scanCount || 0,
      lastScanned: site.lastScanned,
      trend: site.previousScore
        ? site.currentScore - site.previousScore
        : 0,
    }));

    res.json({
      success: true,
      data: {
        sites: leaderboard,
        total: leaderboard.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /v1/leaderboard/category/:category - Get leaderboard by category
leaderboardRouter.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    // This would filter by category in production
    // For now, return top sites
    const sites = await db.getTopSites(limit);

    res.json({
      success: true,
      data: {
        category,
        sites,
        total: sites.length,
      },
    });
  } catch (error) {
    next(error);
  }
});
