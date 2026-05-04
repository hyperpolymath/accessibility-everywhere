type collection
type cursor
type savedDoc = {_key: string}

@send external collSave: (collection, 'a) => promise<savedDoc> = "save"
@send external collUpdate: (collection, string, 'a) => promise<unit> = "update"
@send external collDocument: (collection, string) => promise<'a> = "document"
@send external collByExample: (collection, 'a) => promise<cursor> = "byExample"
@send external collCount: collection => promise<{"count": int}> = "count"

@send external cursorAll: cursor => promise<array<'a>> = "all"
@get external cursorCount: cursor => option<int> = "count"

type wcagLevel = [#A | #"AA" | #"AAA"]
type siteStatus = [#active | #inactive | #failed]

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
}

type scan = {
  _key: string,
  siteKey: string,
  timestamp: string,
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
  impact: string,
  description: string,
  helpUrl: string,
  selector: string,
  html: string,
  timestamp: Date.t,
  fixed: bool,
}

type organization = {
  _key: string,
  name: string,
  tier: string,
}

type criterionCount = {criterion: string, count: int}
type trendPoint = {timestamp: Date.t, violations: int, score: int}

type service = {
  sites: collection,
  scans: collection,
  violations: collection,
  wcagCriteria: collection,
  organizations: collection,
  siteScans: collection,
  scanViolations: collection,
  violationCriteria: collection,
  orgSites: collection,
}

@module("@accessibility-everywhere/core")
external createArangoDBService: unit => service = "createArangoDBService"
@module("@accessibility-everywhere/core") external initialize: service => promise<unit> = "initialize"
@module("@accessibility-everywhere/core") external getSiteByUrl: (service, string) => promise<option<site>> = "getSiteByUrl"
@module("@accessibility-everywhere/core")
external getRecentScansForSite: (service, string, ~limit: int=?) => promise<array<scan>> = "getRecentScansForSite"
@module("@accessibility-everywhere/core")
external getViolationsForScan: (service, string) => promise<array<violation>> = "getViolationsForScan"
@module("@accessibility-everywhere/core")
external getTopSites: (service, ~limit: int=?) => promise<array<site>> = "getTopSites"
@module("@accessibility-everywhere/core")
external getCommonViolations: (service, ~limit: int=?) => promise<array<criterionCount>> = "getCommonViolations"
@module("@accessibility-everywhere/core")
external getSiteViolationTrend: (service, string, ~days: int=?) => promise<array<trendPoint>> = "getSiteViolationTrend"
@module("@accessibility-everywhere/core")
external getOrganizationSites: (service, string) => promise<array<site>> = "getOrganizationSites"

type scanner

type scanOptions = {
  url: string,
  wcagLevel: wcagLevel,
  screenshot?: bool,
}

type scanNodeDetail = {target: array<string>, html: string}
type scanViolationDetail = {
  impact: string,
  description: string,
  helpUrl: string,
  wcag: array<string>,
  nodes: array<scanNodeDetail>,
}
type scanPassDetail = {description: string}
type scanIncompleteDetail = {description: string}
type scanMetadata = {userAgent: string}
type scanResult = {
  url: string,
  timestamp: string,
  score: int,
  duration: int,
  violations: array<scanViolationDetail>,
  passes: array<scanPassDetail>,
  incomplete: array<scanIncompleteDetail>,
  metadata: scanMetadata,
}

@module("@accessibility-everywhere/scanner") external createScanner: unit => scanner = "createScanner"
@send external runScan: (scanner, scanOptions) => promise<scanResult> = "scan"
