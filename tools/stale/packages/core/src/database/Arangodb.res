type wcagLevel = [#A | #"AA" | #"AAA"]
type impact = [#critical | #serious | #moderate | #minor]
type principle = [#perceivable | #operable | #understandable | #robust]
type siteStatus = [#active | #inactive | #failed]
type orgTier = [#free | #pro | #enterprise]

type arangoConfig = {
  url: string,
  database: string,
  username: string,
  password: string,
}

type site = {
  _key: string,
  url: string,
  domain: string,
  firstScanned: Date.t,
  lastScanned: Date.t,
  scanCount: int,
  currentScore: int,
  previousScore?: int,
  status: siteStatus,
  metadata?: Dict.t<JSON.t>,
}

type scan = {
  _key: string,
  siteKey: string,
  timestamp: Date.t,
  score: int,
  violations: int,
  passes: int,
  incomplete: int,
  url: string,
  wcagLevel: wcagLevel,
  duration: int,
  userAgent?: string,
}

type violation = {
  _key: string,
  scanKey: string,
  siteKey: string,
  wcagCriterion: string,
  wcagLevel: wcagLevel,
  impact: impact,
  description: string,
  helpUrl: string,
  selector: string,
  html: string,
  timestamp: Date.t,
  fixed: bool,
}

type wcagCriterion = {
  _key: string,
  criterion: string,
  level: wcagLevel,
  principle: principle,
  guideline: string,
  title: string,
  description: string,
  successCriteria: string,
  techniques: array<string>,
  failures: array<string>,
}

type organization = {
  _key: string,
  name: string,
  domain: string,
  contactEmail?: string,
  tier: orgTier,
  createdAt: Date.t,
  apiKey?: string,
}

module Arango = {
  type database
  type collection
  type cursor

  type collectionInfo = {name: string}
  type indexSpec = {
    \"type": string,
    fields: array<string>,
    unique?: bool,
    sparse?: bool,
  }
  type databaseInit = {
    url: string,
    databaseName: string,
    auth: {"username": string, "password": string},
  }

  @module("arangojs") @new external make: databaseInit => database = "Database"

  @get external name: database => string = "name"
  @send external listDatabases: database => promise<array<string>> = "listDatabases"
  @send external createDatabase: (database, string) => promise<unit> = "createDatabase"
  @send external listCollections: database => promise<array<collectionInfo>> = "listCollections"
  @send external createCollection: (database, string) => promise<collection> = "createCollection"
  @send external createEdgeCollection: (database, string) => promise<collection> = "createEdgeCollection"
  @send external collection: (database, string) => collection = "collection"
  @send external query: (database, string, 'bind) => promise<cursor> = "query"
  @send external queryNoBind: (database, string) => promise<cursor> = "query"

  @send external ensureIndex: (collection, indexSpec) => promise<unit> = "ensureIndex"
  @send external save: (collection, 'a) => promise<unit> = "save"
  @send external count: collection => promise<{"count": int}> = "count"

  @send external all: cursor => promise<array<'a>> = "all"
}

type service = {
  db: Arango.database,
  mutable sites: Arango.collection,
  mutable scans: Arango.collection,
  mutable violations: Arango.collection,
  mutable wcagCriteria: Arango.collection,
  mutable organizations: Arango.collection,
  mutable siteScans: Arango.collection,
  mutable scanViolations: Arango.collection,
  mutable violationCriteria: Arango.collection,
  mutable orgSites: Arango.collection,
}

@val external uninitialised: 'a = "undefined"

let make = (config: arangoConfig): service => {
  let db = Arango.make({
    url: config.url,
    databaseName: config.database,
    auth: {"username": config.username, "password": config.password},
  })
  {
    db,
    sites: uninitialised,
    scans: uninitialised,
    violations: uninitialised,
    wcagCriteria: uninitialised,
    organizations: uninitialised,
    siteScans: uninitialised,
    scanViolations: uninitialised,
    violationCriteria: uninitialised,
    orgSites: uninitialised,
  }
}

let getWCAGCriteriaData = (): array<wcagCriterion> => [
  {
    _key: "1_1_1",
    criterion: "1.1.1",
    level: #A,
    principle: #perceivable,
    guideline: "1.1",
    title: "Non-text Content",
    description: "All non-text content has a text alternative",
    successCriteria: "Provide text alternatives for any non-text content",
    techniques: ["H37", "H36", "G94", "G95"],
    failures: ["F3", "F13", "F20", "F30", "F38", "F39", "F65", "F67", "F71", "F72"],
  },
  {
    _key: "1_3_1",
    criterion: "1.3.1",
    level: #A,
    principle: #perceivable,
    guideline: "1.3",
    title: "Info and Relationships",
    description: "Information, structure, and relationships can be programmatically determined",
    successCriteria: "Information, structure, and relationships conveyed through presentation can be programmatically determined",
    techniques: ["H42", "H43", "H44", "H48", "H51", "H63", "H71", "H73", "H85"],
    failures: ["F2", "F33", "F34", "F42", "F43", "F46", "F48", "F68", "F87", "F90", "F91", "F92"],
  },
  {
    _key: "1_4_3",
    criterion: "1.4.3",
    level: #"AA",
    principle: #perceivable,
    guideline: "1.4",
    title: "Contrast (Minimum)",
    description: "Text has a contrast ratio of at least 4.5:1",
    successCriteria: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1",
    techniques: ["G17", "G18", "G145", "G148", "G174"],
    failures: ["F24", "F83"],
  },
  {
    _key: "2_1_1",
    criterion: "2.1.1",
    level: #A,
    principle: #operable,
    guideline: "2.1",
    title: "Keyboard",
    description: "All functionality is available from a keyboard",
    successCriteria: "All functionality of the content is operable through a keyboard interface",
    techniques: ["G202", "H91"],
    failures: ["F54", "F55", "F42"],
  },
  {
    _key: "2_4_1",
    criterion: "2.4.1",
    level: #A,
    principle: #operable,
    guideline: "2.4",
    title: "Bypass Blocks",
    description: "A mechanism is available to bypass blocks of content",
    successCriteria: "A mechanism is available to bypass blocks of content that are repeated on multiple Web pages",
    techniques: ["G1", "G123", "G124", "H69", "H70"],
    failures: ["F"],
  },
  {
    _key: "2_4_2",
    criterion: "2.4.2",
    level: #A,
    principle: #operable,
    guideline: "2.4",
    title: "Page Titled",
    description: "Web pages have titles that describe topic or purpose",
    successCriteria: "Web pages have titles that describe topic or purpose",
    techniques: ["G88", "H25"],
    failures: ["F25"],
  },
  {
    _key: "3_1_1",
    criterion: "3.1.1",
    level: #A,
    principle: #understandable,
    guideline: "3.1",
    title: "Language of Page",
    description: "The default human language can be programmatically determined",
    successCriteria: "The default human language of each Web page can be programmatically determined",
    techniques: ["H57"],
    failures: [],
  },
  {
    _key: "3_2_3",
    criterion: "3.2.3",
    level: #"AA",
    principle: #understandable,
    guideline: "3.2",
    title: "Consistent Navigation",
    description: "Navigation mechanisms are consistent",
    successCriteria: "Navigational mechanisms that are repeated on multiple Web pages occur in the same relative order",
    techniques: ["G61"],
    failures: ["F66"],
  },
  {
    _key: "4_1_1",
    criterion: "4.1.1",
    level: #A,
    principle: #robust,
    guideline: "4.1",
    title: "Parsing",
    description: "Content can be parsed by user agents",
    successCriteria: "Elements have complete start and end tags, are nested according to specifications",
    techniques: ["G134", "G192", "H88", "H74", "H93", "H94"],
    failures: ["F70", "F77"],
  },
  {
    _key: "4_1_2",
    criterion: "4.1.2",
    level: #A,
    principle: #robust,
    guideline: "4.1",
    title: "Name, Role, Value",
    description: "User interface components have programmatically determined name, role, and value",
    successCriteria: "For all user interface components, the name and role can be programmatically determined",
    techniques: ["G108", "H91", "H44", "H64", "H65", "H88"],
    failures: ["F15", "F20", "F59", "F68", "F79", "F86", "F89"],
  },
]

let createCollectionIfNotExists = async (db: Arango.database, name: string) => {
  let collections = await Arango.listCollections(db)
  if !(collections->Array.some(c => c.name === name)) {
    let _ = await Arango.createCollection(db, name)
  }
}

let createEdgeCollectionIfNotExists = async (db: Arango.database, name: string) => {
  let collections = await Arango.listCollections(db)
  if !(collections->Array.some(c => c.name === name)) {
    let _ = await Arango.createEdgeCollection(db, name)
  }
}

let createIndexes = async (svc: service) => {
  await Arango.ensureIndex(svc.sites, {\"type": "persistent", fields: ["url"], unique: true})
  await Arango.ensureIndex(svc.sites, {\"type": "persistent", fields: ["domain"]})
  await Arango.ensureIndex(svc.sites, {\"type": "persistent", fields: ["currentScore"]})

  await Arango.ensureIndex(svc.scans, {\"type": "persistent", fields: ["siteKey"]})
  await Arango.ensureIndex(svc.scans, {\"type": "persistent", fields: ["timestamp"]})
  await Arango.ensureIndex(svc.scans, {\"type": "persistent", fields: ["score"]})

  await Arango.ensureIndex(svc.violations, {\"type": "persistent", fields: ["scanKey"]})
  await Arango.ensureIndex(svc.violations, {\"type": "persistent", fields: ["siteKey"]})
  await Arango.ensureIndex(svc.violations, {\"type": "persistent", fields: ["wcagCriterion"]})
  await Arango.ensureIndex(svc.violations, {\"type": "persistent", fields: ["impact"]})
  await Arango.ensureIndex(svc.violations, {\"type": "persistent", fields: ["fixed"]})

  await Arango.ensureIndex(svc.wcagCriteria, {
    \"type": "persistent",
    fields: ["criterion"],
    unique: true,
  })
  await Arango.ensureIndex(svc.wcagCriteria, {\"type": "persistent", fields: ["level"]})

  await Arango.ensureIndex(svc.organizations, {\"type": "persistent", fields: ["domain"]})
  await Arango.ensureIndex(svc.organizations, {
    \"type": "persistent",
    fields: ["apiKey"],
    unique: true,
    sparse: true,
  })
}

let initializeWCAGCriteria = async (svc: service) => {
  let countResult = await Arango.count(svc.wcagCriteria)
  if countResult["count"] === 0 {
    let criteria = getWCAGCriteriaData()
    for i in 0 to Array.length(criteria) - 1 {
      let c = criteria->Array.getUnsafe(i)
      await Arango.save(svc.wcagCriteria, c)
    }
  }
}

let initialize = async (svc: service) => {
  let databases = await Arango.listDatabases(svc.db)
  let dbName = Arango.name(svc.db)
  if !(databases->Array.includes(dbName)) {
    let _ = await Arango.createDatabase(svc.db, dbName)
  }

  await createCollectionIfNotExists(svc.db, "sites")
  await createCollectionIfNotExists(svc.db, "scans")
  await createCollectionIfNotExists(svc.db, "violations")
  await createCollectionIfNotExists(svc.db, "wcag_criteria")
  await createCollectionIfNotExists(svc.db, "organizations")

  await createEdgeCollectionIfNotExists(svc.db, "site_scans")
  await createEdgeCollectionIfNotExists(svc.db, "scan_violations")
  await createEdgeCollectionIfNotExists(svc.db, "violation_criteria")
  await createEdgeCollectionIfNotExists(svc.db, "org_sites")

  svc.sites = Arango.collection(svc.db, "sites")
  svc.scans = Arango.collection(svc.db, "scans")
  svc.violations = Arango.collection(svc.db, "violations")
  svc.wcagCriteria = Arango.collection(svc.db, "wcag_criteria")
  svc.organizations = Arango.collection(svc.db, "organizations")
  svc.siteScans = Arango.collection(svc.db, "site_scans")
  svc.scanViolations = Arango.collection(svc.db, "scan_violations")
  svc.violationCriteria = Arango.collection(svc.db, "violation_criteria")
  svc.orgSites = Arango.collection(svc.db, "org_sites")

  await createIndexes(svc)
  await initializeWCAGCriteria(svc)
}

let getSiteByUrl = async (svc: service, url: string): option<site> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR site IN sites FILTER site.url == @url LIMIT 1 RETURN site",
    {"url": url},
  )
  let results = await Arango.all(cursor)
  Array.length(results) > 0 ? Some(results->Array.getUnsafe(0)) : None
}

let getRecentScansForSite = async (svc: service, siteKey: string, ~limit=10): array<scan> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR scan IN scans FILTER scan.siteKey == @siteKey SORT scan.timestamp DESC LIMIT @limit RETURN scan",
    {"siteKey": siteKey, "limit": limit},
  )
  await Arango.all(cursor)
}

let getViolationsForScan = async (svc: service, scanKey: string): array<violation> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR violation IN violations FILTER violation.scanKey == @scanKey SORT violation.impact DESC RETURN violation",
    {"scanKey": scanKey},
  )
  await Arango.all(cursor)
}

let getTopSites = async (svc: service, ~limit=100): array<site> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR site IN sites FILTER site.currentScore > 0 SORT site.currentScore DESC LIMIT @limit RETURN site",
    {"limit": limit},
  )
  await Arango.all(cursor)
}

type criterionCount = {criterion: string, count: int}

let getCommonViolations = async (svc: service, ~limit=10): array<criterionCount> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR violation IN violations COLLECT wcagCriterion = violation.wcagCriterion WITH COUNT INTO count SORT count DESC LIMIT @limit RETURN {criterion: wcagCriterion, count: count}",
    {"limit": limit},
  )
  await Arango.all(cursor)
}

type trendPoint = {timestamp: Date.t, violations: int, score: int}

let getSiteViolationTrend = async (svc: service, siteKey: string, ~days=30): array<trendPoint> => {
  let startDate = Date.make()
  startDate->Date.setDate(Date.getDate(startDate) - days)
  let cursor = await Arango.query(
    svc.db,
    "FOR scan IN scans FILTER scan.siteKey == @siteKey AND scan.timestamp >= @startDate SORT scan.timestamp ASC RETURN {timestamp: scan.timestamp, violations: scan.violations, score: scan.score}",
    {"siteKey": siteKey, "startDate": startDate},
  )
  await Arango.all(cursor)
}

let getOrganizationSites = async (svc: service, orgKey: string): array<site> => {
  let cursor = await Arango.query(
    svc.db,
    "FOR org IN organizations FILTER org._key == @orgKey FOR v, e IN 1..1 OUTBOUND org org_sites RETURN v",
    {"orgKey": orgKey},
  )
  await Arango.all(cursor)
}

@val external envGet: string => option<string> = "process.env"

let createArangoDBService = (~config: option<arangoConfig>=?) => {
  let defaults: arangoConfig = {
    url: %raw(`process.env.ARANGO_URL || "http://localhost:8529"`),
    database: %raw(`process.env.ARANGO_DATABASE || "accessibility"`),
    username: %raw(`process.env.ARANGO_USERNAME || "root"`),
    password: %raw(`process.env.ARANGO_PASSWORD || "development"`),
  }
  let merged = switch config {
  | Some(c) => c
  | None => defaults
  }
  make(merged)
}
