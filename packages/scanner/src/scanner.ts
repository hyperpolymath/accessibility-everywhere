import { Browser, Page, launch } from 'puppeteer';
import { chromium, Browser as PlaywrightBrowser, Page as PlaywrightPage } from 'playwright';
import * as axe from 'axe-core';
import * as fs from 'fs';
import * as path from 'path';

export interface ScanOptions {
  url: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
  timeout?: number;
  waitForSelector?: string;
  screenshot?: boolean;
  engine?: 'puppeteer' | 'playwright';
  viewport?: {
    width: number;
    height: number;
  };
}

export interface ScanResult {
  url: string;
  timestamp: Date;
  score: number;
  violations: ViolationDetail[];
  passes: PassDetail[];
  incomplete: IncompleteDetail[];
  inapplicable: InapplicableDetail[];
  wcagLevel: 'A' | 'AA' | 'AAA';
  duration: number;
  screenshot?: string;
  metadata: {
    title: string;
    description?: string;
    language?: string;
    viewport: { width: number; height: number };
    userAgent: string;
  };
}

export interface ViolationDetail {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  wcag: string[];
  nodes: NodeDetail[];
}

export interface NodeDetail {
  html: string;
  target: string[];
  failureSummary: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface PassDetail {
  id: string;
  description: string;
  help: string;
  tags: string[];
  wcag: string[];
  nodes: NodeDetail[];
}

export interface IncompleteDetail {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  wcag: string[];
  nodes: NodeDetail[];
}

export interface InapplicableDetail {
  id: string;
  description: string;
  help: string;
  tags: string[];
  wcag: string[];
}

export class AccessibilityScanner {
  private axeSource: string;

  constructor() {
    // Load axe-core source
    this.axeSource = fs.readFileSync(
      require.resolve('axe-core/axe.min.js'),
      'utf8'
    );
  }

  async scan(options: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now();
    const engine = options.engine || 'puppeteer';

    if (engine === 'puppeteer') {
      return this.scanWithPuppeteer(options, startTime);
    } else {
      return this.scanWithPlaywright(options, startTime);
    }
  }

  private async scanWithPuppeteer(options: ScanOptions, startTime: number): Promise<ScanResult> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      page = await browser.newPage();

      // Set viewport
      const viewport = options.viewport || { width: 1920, height: 1080 };
      await page.setViewport(viewport);

      // Navigate to URL
      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000,
      });

      // Wait for selector if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 30000,
        });
      }

      // Inject axe-core
      await page.evaluate(this.axeSource);

      // Run axe-core scan
      const wcagTags = this.getWCAGTags(options.wcagLevel || 'AA');
      const axeResults = await page.evaluate((tags) => {
        return (window as any).axe.run({
          runOnly: {
            type: 'tag',
            values: tags,
          },
        });
      }, wcagTags);

      // Get page metadata
      const metadata = await page.evaluate(() => {
        const title = document.title;
        const descriptionMeta = document.querySelector('meta[name="description"]');
        const description = descriptionMeta ? descriptionMeta.getAttribute('content') : undefined;
        const htmlLang = document.documentElement.lang;
        return {
          title,
          description: description || undefined,
          language: htmlLang || undefined,
        };
      });

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (options.screenshot) {
        const screenshotBuffer = await page.screenshot({ fullPage: true }) as Buffer;
        screenshot = screenshotBuffer.toString('base64');
      }

      const duration = Date.now() - startTime;
      const score = this.calculateScore(axeResults);

      const result: ScanResult = {
        url: options.url,
        timestamp: new Date(),
        score,
        violations: this.mapViolations(axeResults.violations),
        passes: this.mapPasses(axeResults.passes),
        incomplete: this.mapIncomplete(axeResults.incomplete),
        inapplicable: this.mapInapplicable(axeResults.inapplicable),
        wcagLevel: options.wcagLevel || 'AA',
        duration,
        screenshot,
        metadata: {
          ...metadata,
          viewport,
          userAgent: await browser.userAgent(),
        },
      };

      return result;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  private async scanWithPlaywright(options: ScanOptions, startTime: number): Promise<ScanResult> {
    let browser: PlaywrightBrowser | null = null;
    let page: PlaywrightPage | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      page = await browser.newPage();

      // Set viewport
      const viewport = options.viewport || { width: 1920, height: 1080 };
      await page.setViewportSize(viewport);

      // Navigate to URL
      await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000,
      });

      // Wait for selector if specified
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 30000,
        });
      }

      // Inject axe-core
      await page.addScriptTag({ content: this.axeSource });

      // Run axe-core scan
      const wcagTags = this.getWCAGTags(options.wcagLevel || 'AA');
      const axeResults = await page.evaluate((tags) => {
        return (window as any).axe.run({
          runOnly: {
            type: 'tag',
            values: tags,
          },
        });
      }, wcagTags);

      // Get page metadata
      const metadata = await page.evaluate(() => {
        const title = document.title;
        const descriptionMeta = document.querySelector('meta[name="description"]');
        const description = descriptionMeta ? descriptionMeta.getAttribute('content') : undefined;
        const htmlLang = document.documentElement.lang;
        return {
          title,
          description: description || undefined,
          language: htmlLang || undefined,
        };
      });

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (options.screenshot) {
        const screenshotBuffer = await page.screenshot({ fullPage: true }) as Buffer;
        screenshot = screenshotBuffer.toString('base64');
      }

      const duration = Date.now() - startTime;
      const score = this.calculateScore(axeResults);

      const result: ScanResult = {
        url: options.url,
        timestamp: new Date(),
        score,
        violations: this.mapViolations(axeResults.violations),
        passes: this.mapPasses(axeResults.passes),
        incomplete: this.mapIncomplete(axeResults.incomplete),
        inapplicable: this.mapInapplicable(axeResults.inapplicable),
        wcagLevel: options.wcagLevel || 'AA',
        duration,
        screenshot,
        metadata: {
          ...metadata,
          viewport,
          userAgent: await page.evaluate(() => navigator.userAgent),
        },
      };

      return result;
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  private getWCAGTags(level: 'A' | 'AA' | 'AAA'): string[] {
    const tags = ['wcag2a', 'wcag21a', 'wcag22a'];
    if (level === 'AA' || level === 'AAA') {
      tags.push('wcag2aa', 'wcag21aa', 'wcag22aa');
    }
    if (level === 'AAA') {
      tags.push('wcag2aaa', 'wcag21aaa', 'wcag22aaa');
    }
    return tags;
  }

  private calculateScore(axeResults: any): number {
    const totalChecks = axeResults.violations.length + axeResults.passes.length;
    if (totalChecks === 0) return 0;

    // Weight violations by impact
    const impactWeights = {
      critical: 10,
      serious: 5,
      moderate: 3,
      minor: 1,
    };

    let totalPenalty = 0;
    for (const violation of axeResults.violations) {
      const weight = impactWeights[violation.impact as keyof typeof impactWeights] || 1;
      totalPenalty += weight * violation.nodes.length;
    }

    const maxPossibleScore = totalChecks * 10;
    const score = Math.max(0, Math.round(((maxPossibleScore - totalPenalty) / maxPossibleScore) * 100));

    return score;
  }

  private mapViolations(violations: any[]): ViolationDetail[] {
    return violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      wcag: v.tags.filter((t: string) => t.startsWith('wcag')),
      nodes: v.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
        impact: n.impact,
      })),
    }));
  }

  private mapPasses(passes: any[]): PassDetail[] {
    return passes.map(p => ({
      id: p.id,
      description: p.description,
      help: p.help,
      tags: p.tags,
      wcag: p.tags.filter((t: string) => t.startsWith('wcag')),
      nodes: p.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: '',
        impact: 'minor' as const,
      })),
    }));
  }

  private mapIncomplete(incomplete: any[]): IncompleteDetail[] {
    return incomplete.map(i => ({
      id: i.id,
      impact: i.impact,
      description: i.description,
      help: i.help,
      helpUrl: i.helpUrl,
      tags: i.tags,
      wcag: i.tags.filter((t: string) => t.startsWith('wcag')),
      nodes: i.nodes.map((n: any) => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
        impact: n.impact,
      })),
    }));
  }

  private mapInapplicable(inapplicable: any[]): InapplicableDetail[] {
    return inapplicable.map(i => ({
      id: i.id,
      description: i.description,
      help: i.help,
      tags: i.tags,
      wcag: i.tags.filter((t: string) => t.startsWith('wcag')),
    }));
  }

  async scanMultiple(urls: string[], options: Omit<ScanOptions, 'url'>): Promise<ScanResult[]> {
    const results: ScanResult[] = [];
    for (const url of urls) {
      try {
        const result = await this.scan({ ...options, url });
        results.push(result);
      } catch (error) {
        console.error(`Failed to scan ${url}:`, error);
      }
    }
    return results;
  }
}

export function createScanner(): AccessibilityScanner {
  return new AccessibilityScanner();
}
