import { Database, aql } from 'arangojs';
import { DocumentCollection, EdgeCollection } from 'arangojs/collection';

export interface ArangoConfig {
  url: string;
  database: string;
  username: string;
  password: string;
}

export interface Site {
  _key: string;
  url: string;
  domain: string;
  firstScanned: Date;
  lastScanned: Date;
  scanCount: number;
  currentScore: number;
  previousScore?: number;
  status: 'active' | 'inactive' | 'failed';
  metadata?: Record<string, any>;
}

export interface Scan {
  _key: string;
  siteKey: string;
  timestamp: Date;
  score: number;
  violations: number;
  passes: number;
  incomplete: number;
  url: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  duration: number;
  userAgent?: string;
}

export interface Violation {
  _key: string;
  scanKey: string;
  siteKey: string;
  wcagCriterion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  helpUrl: string;
  selector: string;
  html: string;
  timestamp: Date;
  fixed: boolean;
}

export interface WCAGCriterion {
  _key: string;
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  principle: 'perceivable' | 'operable' | 'understandable' | 'robust';
  guideline: string;
  title: string;
  description: string;
  successCriteria: string;
  techniques: string[];
  failures: string[];
}

export interface Organization {
  _key: string;
  name: string;
  domain: string;
  contactEmail?: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  apiKey?: string;
}

export class ArangoDBService {
  private db: Database;
  public sites!: DocumentCollection<Site>;
  public scans!: DocumentCollection<Scan>;
  public violations!: DocumentCollection<Violation>;
  public wcagCriteria!: DocumentCollection<WCAGCriterion>;
  public organizations!: DocumentCollection<Organization>;
  public siteScans!: EdgeCollection;
  public scanViolations!: EdgeCollection;
  public violationCriteria!: EdgeCollection;
  public orgSites!: EdgeCollection;

  constructor(config: ArangoConfig) {
    this.db = new Database({
      url: config.url,
      databaseName: config.database,
      auth: {
        username: config.username,
        password: config.password,
      },
    });
  }

  async initialize(): Promise<void> {
    // Create database if it doesn't exist
    const databases = await this.db.listDatabases();
    if (!databases.includes(this.db.name)) {
      await this.db.createDatabase(this.db.name);
    }

    // Create collections
    await this.createCollectionIfNotExists('sites');
    await this.createCollectionIfNotExists('scans');
    await this.createCollectionIfNotExists('violations');
    await this.createCollectionIfNotExists('wcag_criteria');
    await this.createCollectionIfNotExists('organizations');

    // Create edge collections for graph relationships
    await this.createEdgeCollectionIfNotExists('site_scans');
    await this.createEdgeCollectionIfNotExists('scan_violations');
    await this.createEdgeCollectionIfNotExists('violation_criteria');
    await this.createEdgeCollectionIfNotExists('org_sites');

    // Assign collections
    this.sites = this.db.collection('sites');
    this.scans = this.db.collection('scans');
    this.violations = this.db.collection('violations');
    this.wcagCriteria = this.db.collection('wcag_criteria');
    this.organizations = this.db.collection('organizations');
    this.siteScans = this.db.collection('site_scans');
    this.scanViolations = this.db.collection('scan_violations');
    this.violationCriteria = this.db.collection('violation_criteria');
    this.orgSites = this.db.collection('org_sites');

    // Create indexes
    await this.createIndexes();

    // Initialize WCAG criteria
    await this.initializeWCAGCriteria();
  }

  private async createCollectionIfNotExists(name: string): Promise<void> {
    const collections = await this.db.listCollections();
    if (!collections.some(c => c.name === name)) {
      await this.db.createCollection(name);
    }
  }

  private async createEdgeCollectionIfNotExists(name: string): Promise<void> {
    const collections = await this.db.listCollections();
    if (!collections.some(c => c.name === name)) {
      await this.db.createEdgeCollection(name);
    }
  }

  private async createIndexes(): Promise<void> {
    // Sites indexes
    await this.sites.ensureIndex({ type: 'persistent', fields: ['url'], unique: true });
    await this.sites.ensureIndex({ type: 'persistent', fields: ['domain'] });
    await this.sites.ensureIndex({ type: 'persistent', fields: ['currentScore'] });

    // Scans indexes
    await this.scans.ensureIndex({ type: 'persistent', fields: ['siteKey'] });
    await this.scans.ensureIndex({ type: 'persistent', fields: ['timestamp'] });
    await this.scans.ensureIndex({ type: 'persistent', fields: ['score'] });

    // Violations indexes
    await this.violations.ensureIndex({ type: 'persistent', fields: ['scanKey'] });
    await this.violations.ensureIndex({ type: 'persistent', fields: ['siteKey'] });
    await this.violations.ensureIndex({ type: 'persistent', fields: ['wcagCriterion'] });
    await this.violations.ensureIndex({ type: 'persistent', fields: ['impact'] });
    await this.violations.ensureIndex({ type: 'persistent', fields: ['fixed'] });

    // WCAG Criteria indexes
    await this.wcagCriteria.ensureIndex({ type: 'persistent', fields: ['criterion'], unique: true });
    await this.wcagCriteria.ensureIndex({ type: 'persistent', fields: ['level'] });

    // Organizations indexes
    await this.organizations.ensureIndex({ type: 'persistent', fields: ['domain'] });
    await this.organizations.ensureIndex({ type: 'persistent', fields: ['apiKey'], unique: true, sparse: true });
  }

  private async initializeWCAGCriteria(): Promise<void> {
    const count = await this.wcagCriteria.count();
    if (count.count === 0) {
      // Insert WCAG 2.1 Level AA criteria
      const criteria = this.getWCAGCriteriaData();
      for (const criterion of criteria) {
        await this.wcagCriteria.save(criterion);
      }
    }
  }

  private getWCAGCriteriaData(): WCAGCriterion[] {
    return [
      {
        _key: '1_1_1',
        criterion: '1.1.1',
        level: 'A',
        principle: 'perceivable',
        guideline: '1.1',
        title: 'Non-text Content',
        description: 'All non-text content has a text alternative',
        successCriteria: 'Provide text alternatives for any non-text content',
        techniques: ['H37', 'H36', 'G94', 'G95'],
        failures: ['F3', 'F13', 'F20', 'F30', 'F38', 'F39', 'F65', 'F67', 'F71', 'F72'],
      },
      {
        _key: '1_3_1',
        criterion: '1.3.1',
        level: 'A',
        principle: 'perceivable',
        guideline: '1.3',
        title: 'Info and Relationships',
        description: 'Information, structure, and relationships can be programmatically determined',
        successCriteria: 'Information, structure, and relationships conveyed through presentation can be programmatically determined',
        techniques: ['H42', 'H43', 'H44', 'H48', 'H51', 'H63', 'H71', 'H73', 'H85'],
        failures: ['F2', 'F33', 'F34', 'F42', 'F43', 'F46', 'F48', 'F68', 'F87', 'F90', 'F91', 'F92'],
      },
      {
        _key: '1_4_3',
        criterion: '1.4.3',
        level: 'AA',
        principle: 'perceivable',
        guideline: '1.4',
        title: 'Contrast (Minimum)',
        description: 'Text has a contrast ratio of at least 4.5:1',
        successCriteria: 'The visual presentation of text and images of text has a contrast ratio of at least 4.5:1',
        techniques: ['G17', 'G18', 'G145', 'G148', 'G174'],
        failures: ['F24', 'F83'],
      },
      {
        _key: '2_1_1',
        criterion: '2.1.1',
        level: 'A',
        principle: 'operable',
        guideline: '2.1',
        title: 'Keyboard',
        description: 'All functionality is available from a keyboard',
        successCriteria: 'All functionality of the content is operable through a keyboard interface',
        techniques: ['G202', 'H91'],
        failures: ['F54', 'F55', 'F42'],
      },
      {
        _key: '2_4_1',
        criterion: '2.4.1',
        level: 'A',
        principle: 'operable',
        guideline: '2.4',
        title: 'Bypass Blocks',
        description: 'A mechanism is available to bypass blocks of content',
        successCriteria: 'A mechanism is available to bypass blocks of content that are repeated on multiple Web pages',
        techniques: ['G1', 'G123', 'G124', 'H69', 'H70'],
        failures: ['F'],
      },
      {
        _key: '2_4_2',
        criterion: '2.4.2',
        level: 'A',
        principle: 'operable',
        guideline: '2.4',
        title: 'Page Titled',
        description: 'Web pages have titles that describe topic or purpose',
        successCriteria: 'Web pages have titles that describe topic or purpose',
        techniques: ['G88', 'H25'],
        failures: ['F25'],
      },
      {
        _key: '3_1_1',
        criterion: '3.1.1',
        level: 'A',
        principle: 'understandable',
        guideline: '3.1',
        title: 'Language of Page',
        description: 'The default human language can be programmatically determined',
        successCriteria: 'The default human language of each Web page can be programmatically determined',
        techniques: ['H57'],
        failures: [],
      },
      {
        _key: '3_2_3',
        criterion: '3.2.3',
        level: 'AA',
        principle: 'understandable',
        guideline: '3.2',
        title: 'Consistent Navigation',
        description: 'Navigation mechanisms are consistent',
        successCriteria: 'Navigational mechanisms that are repeated on multiple Web pages occur in the same relative order',
        techniques: ['G61'],
        failures: ['F66'],
      },
      {
        _key: '4_1_1',
        criterion: '4.1.1',
        level: 'A',
        principle: 'robust',
        guideline: '4.1',
        title: 'Parsing',
        description: 'Content can be parsed by user agents',
        successCriteria: 'Elements have complete start and end tags, are nested according to specifications',
        techniques: ['G134', 'G192', 'H88', 'H74', 'H93', 'H94'],
        failures: ['F70', 'F77'],
      },
      {
        _key: '4_1_2',
        criterion: '4.1.2',
        level: 'A',
        principle: 'robust',
        guideline: '4.1',
        title: 'Name, Role, Value',
        description: 'User interface components have programmatically determined name, role, and value',
        successCriteria: 'For all user interface components, the name and role can be programmatically determined',
        techniques: ['G108', 'H91', 'H44', 'H64', 'H65', 'H88'],
        failures: ['F15', 'F20', 'F59', 'F68', 'F79', 'F86', 'F89'],
      },
    ];
  }

  // Query methods
  async getSiteByUrl(url: string): Promise<Site | null> {
    const cursor = await this.db.query(aql`
      FOR site IN sites
      FILTER site.url == ${url}
      LIMIT 1
      RETURN site
    `);
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async getRecentScansForSite(siteKey: string, limit: number = 10): Promise<Scan[]> {
    const cursor = await this.db.query(aql`
      FOR scan IN scans
      FILTER scan.siteKey == ${siteKey}
      SORT scan.timestamp DESC
      LIMIT ${limit}
      RETURN scan
    `);
    return cursor.all();
  }

  async getViolationsForScan(scanKey: string): Promise<Violation[]> {
    const cursor = await this.db.query(aql`
      FOR violation IN violations
      FILTER violation.scanKey == ${scanKey}
      SORT violation.impact DESC
      RETURN violation
    `);
    return cursor.all();
  }

  async getTopSites(limit: number = 100): Promise<Site[]> {
    const cursor = await this.db.query(aql`
      FOR site IN sites
      FILTER site.currentScore > 0
      SORT site.currentScore DESC
      LIMIT ${limit}
      RETURN site
    `);
    return cursor.all();
  }

  async getCommonViolations(limit: number = 10): Promise<any[]> {
    const cursor = await this.db.query(aql`
      FOR violation IN violations
      COLLECT wcagCriterion = violation.wcagCriterion WITH COUNT INTO count
      SORT count DESC
      LIMIT ${limit}
      RETURN {
        criterion: wcagCriterion,
        count: count
      }
    `);
    return cursor.all();
  }

  async getSiteViolationTrend(siteKey: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const cursor = await this.db.query(aql`
      FOR scan IN scans
      FILTER scan.siteKey == ${siteKey} AND scan.timestamp >= ${startDate}
      SORT scan.timestamp ASC
      RETURN {
        timestamp: scan.timestamp,
        violations: scan.violations,
        score: scan.score
      }
    `);
    return cursor.all();
  }

  async getOrganizationSites(orgKey: string): Promise<Site[]> {
    const cursor = await this.db.query(aql`
      FOR org IN organizations
      FILTER org._key == ${orgKey}
      FOR v, e IN 1..1 OUTBOUND org org_sites
      RETURN v
    `);
    return cursor.all();
  }
}

export function createArangoDBService(config?: Partial<ArangoConfig>): ArangoDBService {
  const defaultConfig: ArangoConfig = {
    url: process.env.ARANGO_URL || 'http://localhost:8529',
    database: process.env.ARANGO_DATABASE || 'accessibility',
    username: process.env.ARANGO_USERNAME || 'root',
    password: process.env.ARANGO_PASSWORD || 'development',
  };

  return new ArangoDBService({ ...defaultConfig, ...config });
}
