Express.Dotenv.config()

let db = Db.createArangoDBService()
let scanner = Db.createScanner()

let app = Express.make()
let port = switch %raw(`process.env.PORT`) {
| "" | "undefined" => 3000
| s => s->Int.fromString->Option.getOr(3000)
}

@val external nodeEnv: option<string> = "process.env.NODE_ENV"
@val external consoleLog: string => unit = "console.log"
@val external consoleError: (string, 'a) => unit = "console.error"

@new external newUrl: string => {"hostname": string} = "URL"
let nowIso = (): string => %raw(`new Date().toISOString()`)
let nowDate = (): Date.t => Date.make()

let _ = Express.use(app, Express.Helmet.make())
let _ = Express.use(app, Express.Cors.make())
let _ = Express.use(app, Express.Compression.make())
let _ = Express.use(app, Express.jsonParser({"limit": "10mb"}))

let limiter = Express.RateLimit.make({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
})
let _ = Express.usePath(app, "/v1/", limiter)

let initializeDatabase = async () => {
  try {
    await Db.initialize(db)
    consoleLog("✓ Database initialized successfully")
  } catch {
  | Exn.Error(err) => {
      consoleError("✗ Database initialization failed:", err)
      %raw(`process.exit(1)`)
    }
  }
}

let respondError = (res, status, message) => {
  let _ = Express.status(res, status)
  Express.resJson(res, {"error": {"message": message, "status": status}})
}

let _ = Express.get(app, "/health", async (_req, res, _next) => {
  Express.resJson(
    res,
    {
      "status": "healthy",
      "timestamp": nowIso(),
      "version": "1.0.0",
    },
  )
})

let _ = Express.get(app, "/v1", async (_req, res, _next) => {
  Express.resJson(
    res,
    {
      "name": "Accessibility Everywhere Monitoring API",
      "version": "1.0.0",
      "description": "Accessibility violation reporting and analytics API",
      "endpoints": {
        "scan": "/v1/scan",
        "violations": "/v1/violations",
        "leaderboard": "/v1/leaderboard",
        "badge": "/v1/badge/:domain",
        "stats": "/v1/stats",
        "dashboard": "/v1/dashboard/:orgId",
      },
      "documentation": "https://docs.accessibility-everywhere.org/api",
    },
  )
})

// ============================================================
// /v1/scan
// ============================================================
let scanRouter = Express.router()

let scanSchema = Joi.object(
  Dict.fromArray([
    ("url", Joi.string()->Joi.uri->Joi.required),
    ("wcagLevel", Joi.string()->Joi.valid(["A", "AA", "AAA"])->Joi.defaultStr("AA")),
    ("screenshot", Joi.boolean()->Joi.defaultBool(false)),
  ]),
)

let parseWcagLevel = (s): Db.wcagLevel =>
  switch s {
  | "A" => #A
  | "AAA" => #"AAA"
  | _ => #"AA"
  }

Express.routerPost(scanRouter, "/", async (req, res, next) => {
  try {
    let result = scanSchema->Joi.validate(Express.body(req))
    switch result.error {
    | Some(err) => {
        let msg = err.details->Array.getUnsafe(0)
        respondError(res, 400, msg.message)
      }
    | None => {
        let value = result.value
        let url = value->Dict.getUnsafe("url")->JSON.Decode.string->Option.getOr("")
        let wcagLevelStr =
          value->Dict.getUnsafe("wcagLevel")->JSON.Decode.string->Option.getOr("AA")
        let wcagLevel = parseWcagLevel(wcagLevelStr)
        let screenshot =
          value->Dict.getUnsafe("screenshot")->JSON.Decode.bool->Option.getOr(false)

        let scanResult = await scanner->Db.runScan({url, wcagLevel, screenshot})

        let urlObj = newUrl(url)
        let domain = urlObj["hostname"]

        let existingSite = await db->Db.getSiteByUrl(url)
        let siteKey = switch existingSite {
        | None => {
            let siteDoc = await Db.collSave(
              db.sites,
              {
                "url": url,
                "domain": domain,
                "firstScanned": nowDate(),
                "lastScanned": nowDate(),
                "scanCount": 1,
                "currentScore": scanResult.score,
                "status": "active",
              },
            )
            siteDoc._key
          }
        | Some(site) => {
            await Db.collUpdate(
              db.sites,
              site._key,
              {
                "lastScanned": nowDate(),
                "scanCount": site.scanCount + 1,
                "previousScore": site.currentScore,
                "currentScore": scanResult.score,
              },
            )
            site._key
          }
        }

        let scanDoc = await Db.collSave(
          db.scans,
          {
            "siteKey": siteKey,
            "timestamp": scanResult.timestamp,
            "score": scanResult.score,
            "violations": Array.length(scanResult.violations),
            "passes": Array.length(scanResult.passes),
            "incomplete": Array.length(scanResult.incomplete),
            "url": url,
            "wcagLevel": wcagLevelStr,
            "duration": scanResult.duration,
            "userAgent": scanResult.metadata.userAgent,
          },
        )

        for vi in 0 to Array.length(scanResult.violations) - 1 {
          let v = scanResult.violations->Array.getUnsafe(vi)
          for ni in 0 to Array.length(v.nodes) - 1 {
            let node = v.nodes->Array.getUnsafe(ni)
            let _ = await Db.collSave(
              db.violations,
              {
                "scanKey": scanDoc._key,
                "siteKey": siteKey,
                "wcagCriterion": v.wcag->Array.get(0)->Option.getOr("unknown"),
                "wcagLevel": wcagLevelStr,
                "impact": v.impact,
                "description": v.description,
                "helpUrl": v.helpUrl,
                "selector": node.target->Array.join(" > "),
                "html": node.html,
                "timestamp": nowDate(),
                "fixed": false,
              },
            )
          }
        }

        Express.resJson(
          res,
          {
            "success": true,
            "data": {
              "url": url,
              "scanId": scanDoc._key,
              "score": scanResult.score,
              "violations": Array.length(scanResult.violations),
              "passes": Array.length(scanResult.passes),
              "incomplete": Array.length(scanResult.incomplete),
              "wcagLevel": wcagLevelStr,
              "timestamp": scanResult.timestamp,
              "details": {
                "violations": scanResult.violations,
                "passes": scanResult.passes,
                "incomplete": scanResult.incomplete,
              },
            },
          },
        )
      }
    }
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerGet(scanRouter, "/:scanId", async (req, res, next) => {
  try {
    let scanId = Express.params(req)->Dict.getUnsafe("scanId")
    let scanDoc: Db.scan = await Db.collDocument(db.scans, scanId)
    let violations = await db->Db.getViolationsForScan(scanId)
    Express.resJson(
      res,
      {
        "success": true,
        "data": {"scan": scanDoc, "violations": violations},
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/scan", scanRouter)

// ============================================================
// /v1/violations
// ============================================================
let violationsRouter = Express.router()

Express.routerPost(violationsRouter, "/", async (req, res, next) => {
  try {
    let body = Express.body(req)
    let url = body->Dict.get("url")->Option.flatMap(JSON.Decode.string)
    let violation = body->Dict.get("violation")
    switch (url, violation) {
    | (Some(url), Some(_)) => {
        let existing = await db->Db.getSiteByUrl(url)
        let siteKey = switch existing {
        | None => {
            let urlObj = newUrl(url)
            let saved = await Db.collSave(
              db.sites,
              {
                "url": url,
                "domain": urlObj["hostname"],
                "firstScanned": nowDate(),
                "lastScanned": nowDate(),
                "scanCount": 0,
                "currentScore": 0,
                "status": "active",
              },
            )
            saved._key
          }
        | Some(site) => site._key
        }

        let _ = await Db.collSave(
          db.violations,
          {
            "siteKey": siteKey,
            "scanKey": "",
            "violationData": violation,
            "timestamp": nowDate(),
            "fixed": false,
          },
        )

        Express.resJson(res, {"success": true, "message": "Violation reported successfully"})
      }
    | _ => respondError(res, 400, "URL and violation are required")
    }
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerGet(violationsRouter, "/common", async (req, res, next) => {
  try {
    let limit =
      Express.query(req)->Dict.get("limit")->Option.flatMap(s => Int.fromString(s))->Option.getOr(10)
    let violations = await db->Db.getCommonViolations(~limit)
    Express.resJson(res, {"success": true, "data": violations})
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerGet(violationsRouter, "/site/:siteKey", async (req, res, next) => {
  try {
    let siteKey = Express.params(req)->Dict.getUnsafe("siteKey")
    let fixed = Express.query(req)->Dict.get("fixed") === Some("true")
    let cursor = await Db.collByExample(db.violations, {"siteKey": siteKey, "fixed": fixed})
    let violations: array<Db.violation> = await Db.cursorAll(cursor)
    Express.resJson(res, {"success": true, "data": violations})
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerPatch(violationsRouter, "/:violationId/fixed", async (req, res, next) => {
  try {
    let violationId = Express.params(req)->Dict.getUnsafe("violationId")
    await Db.collUpdate(db.violations, violationId, {"fixed": true})
    Express.resJson(res, {"success": true, "message": "Violation marked as fixed"})
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/violations", violationsRouter)

// ============================================================
// /v1/leaderboard
// ============================================================
let leaderboardRouter = Express.router()

Express.routerGet(leaderboardRouter, "/", async (req, res, next) => {
  try {
    let limit =
      Express.query(req)->Dict.get("limit")->Option.flatMap(s => Int.fromString(s))->Option.getOr(100)
    let sites = await db->Db.getTopSites(~limit)
    let leaderboard = sites->Array.mapWithIndex((site: Db.site, i) => {
      let trend = switch site.previousScore {
      | Some(prev) => site.currentScore - prev
      | None => 0
      }
      {
        "rank": i + 1,
        "domain": site.domain,
        "url": site.url,
        "score": site.currentScore,
        "violations": site.scanCount,
        "lastScanned": site.lastScanned,
        "trend": trend,
      }
    })
    Express.resJson(
      res,
      {
        "success": true,
        "data": {
          "sites": leaderboard,
          "total": Array.length(leaderboard),
          "lastUpdated": nowIso(),
        },
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerGet(leaderboardRouter, "/category/:category", async (req, res, next) => {
  try {
    let category = Express.params(req)->Dict.getUnsafe("category")
    let limit =
      Express.query(req)->Dict.get("limit")->Option.flatMap(s => Int.fromString(s))->Option.getOr(100)
    let sites = await db->Db.getTopSites(~limit)
    Express.resJson(
      res,
      {
        "success": true,
        "data": {
          "category": category,
          "sites": sites,
          "total": Array.length(sites),
        },
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/leaderboard", leaderboardRouter)

// ============================================================
// /v1/badge
// ============================================================
let badgeRouter = Express.router()

let getGrade = score =>
  if score >= 90 {
    "A"
  } else if score >= 80 {
    "B"
  } else if score >= 70 {
    "C"
  } else if score >= 60 {
    "D"
  } else {
    "F"
  }

let gradeColor = grade =>
  switch grade {
  | "A" => "#28a745"
  | "B" => "#8bc34a"
  | "C" => "#ffc107"
  | "D" => "#ff9800"
  | _ => "#dc3545"
  }

let generateBadgeSVG = score => {
  let grade = getGrade(score)
  let color = gradeColor(grade)
  let scoreStr = Int.toString(score)
  String.trim(
    `
    <svg xmlns="https://www.w3.org/2000/svg" width="160" height="28" role="img" aria-label="Accessibility: ${grade}">
      <title>Accessibility Score: ${scoreStr} (Grade ${grade})</title>
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
        <text aria-hidden="true" x="130" y="17.5" fill="#010101" fill-opacity=".3">${grade} (${scoreStr})</text>
        <text x="130" y="16.5" fill="#fff">${grade} (${scoreStr})</text>
      </g>
    </svg>
  `,
  )
}

Express.routerGet(badgeRouter, "/:domain", async (req, res, next) => {
  try {
    let domain = Express.params(req)->Dict.getUnsafe("domain")
    let format = Express.query(req)->Dict.get("format")->Option.getOr("json")
    let cursor = await Db.collByExample(db.sites, {"domain": domain})
    let sites: array<Db.site> = await Db.cursorAll(cursor)

    if Array.length(sites) === 0 {
      respondError(res, 404, "Site not found")
    } else {
      let site = sites->Array.getUnsafe(0)
      if format === "svg" {
        let svg = generateBadgeSVG(site.currentScore)
        Express.setHeader(res, "Content-Type", "image/svg+xml")
        Express.setHeader(res, "Cache-Control", "public, max-age=3600")
        Express.send(res, svg)
      } else {
        let host = Express.getHeader(req, "host")
        let proto = Express.protocol(req)
        Express.resJson(
          res,
          {
            "success": true,
            "data": {
              "domain": domain,
              "score": site.currentScore,
              "grade": getGrade(site.currentScore),
              "lastScanned": site.lastScanned,
              "badgeUrl": `${proto}://${host}/v1/badge/${domain}?format=svg`,
            },
          },
        )
      }
    }
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/badge", badgeRouter)

// ============================================================
// /v1/stats
// ============================================================
let statsRouter = Express.router()

Express.routerGet(statsRouter, "/", async (_req, res, next) => {
  try {
    let sitesCount = await Db.collCount(db.sites)
    let scansCount = await Db.collCount(db.scans)
    let violationsCount = await Db.collCount(db.violations)
    let commonViolations = await db->Db.getCommonViolations(~limit=5)
    Express.resJson(
      res,
      {
        "success": true,
        "data": {
          "totalSites": sitesCount["count"],
          "totalScans": scansCount["count"],
          "totalViolations": violationsCount["count"],
          "commonViolations": commonViolations,
          "timestamp": nowIso(),
        },
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

Express.routerGet(statsRouter, "/site/:siteKey", async (req, res, next) => {
  try {
    let siteKey = Express.params(req)->Dict.getUnsafe("siteKey")
    let site: Db.site = await Db.collDocument(db.sites, siteKey)
    let scans = await db->Db.getRecentScansForSite(siteKey, ~limit=30)
    let trend = await db->Db.getSiteViolationTrend(siteKey, ~days=30)
    Express.resJson(
      res,
      {
        "success": true,
        "data": {
          "site": site,
          "recentScans": scans,
          "trend": trend,
        },
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/stats", statsRouter)

// ============================================================
// /v1/dashboard
// ============================================================
let dashboardRouter = Express.router()

Express.routerGet(dashboardRouter, "/:orgId", async (req, res, next) => {
  try {
    let orgId = Express.params(req)->Dict.getUnsafe("orgId")
    let org: Db.organization = await Db.collDocument(db.organizations, orgId)
    let sites = await db->Db.getOrganizationSites(orgId)
    let totalSites = Array.length(sites)
    let averageScore = if totalSites > 0 {
      let sum =
        sites->Array.reduce(0, (acc, site: Db.site) => acc + site.currentScore)
      sum / totalSites
    } else {
      0
    }
    let totalViolations = ref(0)
    for i in 0 to Array.length(sites) - 1 {
      let site = sites->Array.getUnsafe(i)
      let cursor = await Db.collByExample(
        db.violations,
        {"siteKey": site._key, "fixed": false},
      )
      let count = Db.cursorCount(cursor)->Option.getOr(0)
      totalViolations := totalViolations.contents + count
    }
    let siteSummaries = sites->Array.map((site: Db.site) => {
      "domain": site.domain,
      "url": site.url,
      "score": site.currentScore,
      "lastScanned": site.lastScanned,
    })
    Express.resJson(
      res,
      {
        "success": true,
        "data": {
          "organization": {"name": org.name, "tier": org.tier},
          "stats": {
            "totalSites": totalSites,
            "averageScore": averageScore,
            "totalViolations": totalViolations.contents,
          },
          "sites": siteSummaries,
        },
      },
    )
  } catch {
  | Exn.Error(err) => next(. err)->ignore
  }
})

let _ = Express.useRouter(app, "/v1/dashboard", dashboardRouter)

// ============================================================
// Error handling + 404 + boot
// ============================================================
Express.useError(app, (err, _req, res, _next) => {
  consoleError("Error:", err)
  let status = 500
  let message = Exn.message(err)->Option.getOr("Internal server error")
  let _ = Express.status(res, status)
  Express.resJson(res, {"error": {"message": message, "status": status}})
})

Express.useFinal(app, (_req, res, _next) => {
  let _ = Express.status(res, 404)
  Express.resJson(res, {"error": {"message": "Endpoint not found", "status": 404}})
})

let startServer = async () => {
  await initializeDatabase()
  Express.listen(app, port, () => {
    consoleLog(`✓ Accessibility Everywhere API listening on port ${Int.toString(port)}`)
    let env = nodeEnv->Option.getOr("development")
    consoleLog(`✓ Environment: ${env}`)
    consoleLog(`✓ Health check: http://localhost:${Int.toString(port)}/health`)
    consoleLog(`✓ API docs: http://localhost:${Int.toString(port)}/v1`)
  })
}

let _ = startServer()->Promise.catch(err => {
  consoleError("Failed to start server:", err)
  %raw(`process.exit(1)`)
})
