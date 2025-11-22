import { Router } from 'express';
import { db } from '../server';

export const badgeRouter = Router();

// GET /v1/badge/:domain - Get badge for a domain
badgeRouter.get('/:domain', async (req, res, next) => {
  try {
    const { domain } = req.params;
    const format = req.query.format || 'json';

    // Find site by domain
    const sites = await db.sites.byExample({ domain }).then(c => c.all());

    if (sites.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Site not found',
          status: 404,
        },
      });
    }

    const site = sites[0];

    if (format === 'svg') {
      // Generate SVG badge
      const svg = generateBadgeSVG(site.currentScore);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(svg);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          domain,
          score: site.currentScore,
          grade: getGrade(site.currentScore),
          lastScanned: site.lastScanned,
          badgeUrl: `${req.protocol}://${req.get('host')}/v1/badge/${domain}?format=svg`,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function generateBadgeSVG(score: number): string {
  const grade = getGrade(score);
  const color = {
    A: '#28a745',
    B: '#8bc34a',
    C: '#ffc107',
    D: '#ff9800',
    F: '#dc3545',
  }[grade];

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="28" role="img" aria-label="Accessibility: ${grade}">
      <title>Accessibility Score: ${score} (Grade ${grade})</title>
      <linearGradient id="s" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <clipPath id="r">
        <rect width="160" height="28" rx="3" fill="#fff"/>
      </clipPath>
      <g clip-path="url(#r)">
        <rect width="100" height="28" fill="#555"/>
        <rect x="100" width="60" height="28" fill="${color}"/>
        <rect width="160" height="28" fill="url(#s)"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
        <text aria-hidden="true" x="50" y="17.5" fill="#010101" fill-opacity=".3">accessibility</text>
        <text x="50" y="16.5" fill="#fff">accessibility</text>
        <text aria-hidden="true" x="130" y="17.5" fill="#010101" fill-opacity=".3">${grade} (${score})</text>
        <text x="130" y="16.5" fill="#fff">${grade} (${score})</text>
      </g>
    </svg>
  `.trim();
}
