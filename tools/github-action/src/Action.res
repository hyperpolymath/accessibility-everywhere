type wcagLevel = [#A | #"AA" | #"AAA"]
type impact = [#critical | #serious | #moderate | #minor]

type nodeDetail = {target: array<string>}
type violationDetail = {
  impact: impact,
  description: string,
  help: string,
  helpUrl: string,
  nodes: array<nodeDetail>,
}
type passDetail = {description: string}
type incompleteDetail = {description: string}

type scanOptions = {
  url: string,
  wcagLevel: wcagLevel,
  screenshot: bool,
}

type scanResult = {
  score: int,
  violations: array<violationDetail>,
  passes: array<passDetail>,
  incomplete: array<incompleteDetail>,
}

module Scanner = {
  type t
  @module("@accessibility-everywhere/scanner") external createScanner: unit => t = "createScanner"
  @send external scan: (t, scanOptions) => promise<scanResult> = "scan"
}

module Core = {
  type getInputOptions = {required?: bool}
  type summary
  @module("@actions/core") external getInputBare: string => string = "getInput"
  @module("@actions/core")
  external getInputWith: (string, getInputOptions) => string = "getInput"

  @module("@actions/core") external info: string => unit = "info"
  @module("@actions/core") external warning: string => unit = "warning"
  @module("@actions/core") external setFailed: string => unit = "setFailed"
  @module("@actions/core") external setOutputStr: (string, string) => unit = "setOutput"
  @module("@actions/core") external setOutputInt: (string, int) => unit = "setOutput"

  @module("@actions/core") @scope("summary") external addRaw: string => summary = "addRaw"
  @send external write: summary => promise<summary> = "write"
}

module Github = {
  type repo = {owner: string, repo: string}
  type pullRequest = {number: int}
  type payload = {pull_request?: pullRequest}
  type context = {payload: payload, repo: repo}

  type createCommentArgs = {
    owner: string,
    repo: string,
    issue_number: int,
    body: string,
  }
  type issuesApi = {createComment: createCommentArgs => promise<unit>}
  type rest = {issues: issuesApi}
  type octokit = {rest: rest}

  @module("@actions/github") external context: context = "context"
  @module("@actions/github") external getOctokit: string => octokit = "getOctokit"
}

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

let gradeEmoji = grade =>
  switch grade {
  | "A" => "🟢"
  | "B" => "🟡"
  | "C" => "🟠"
  | "D" | "F" => "🔴"
  | _ => "⚪"
  }

let impactEmoji = impact =>
  switch impact {
  | #critical => "🔴"
  | #serious => "🟠"
  | #moderate => "🟡"
  | #minor => "🔵"
  }

let impactLabel = impact =>
  switch impact {
  | #critical => "critical"
  | #serious => "serious"
  | #moderate => "moderate"
  | #minor => "minor"
  }

let wcagLabel = wcag =>
  switch wcag {
  | #A => "A"
  | #"AA" => "AA"
  | #"AAA" => "AAA"
  }

let parseWcagLevel = (s): wcagLevel =>
  switch s {
  | "A" => #A
  | "AAA" => #"AAA"
  | _ => #"AA"
  }

let generateSummary = (result: scanResult, url: string, wcagLevel: wcagLevel) => {
  let grade = getGrade(result.score)
  let g = gradeEmoji(grade)
  let parts = [
    `# Accessibility Report ${g}\n\n`,
    `**URL:** ${url}\n`,
    `**WCAG Level:** ${wcagLabel(wcagLevel)}\n`,
    `**Score:** ${Int.toString(result.score)}/100 (Grade ${grade})\n\n`,
    `## Summary\n\n`,
    `| Metric | Count |\n`,
    `|--------|-------|\n`,
    `| ✅ Passes | ${Int.toString(Array.length(result.passes))} |\n`,
    `| ❌ Violations | ${Int.toString(Array.length(result.violations))} |\n`,
    `| ⚠️ Needs Review | ${Int.toString(Array.length(result.incomplete))} |\n\n`,
  ]
  let head = parts->Array.join("")

  let violations = if Array.length(result.violations) > 0 {
    let header = "## Violations\n\n"
    let shown = result.violations->Array.slice(~start=0, ~end=10)
    let body =
      shown
      ->Array.mapWithIndex((v, i) => {
        let e = impactEmoji(v.impact)
        `### ${Int.toString(i + 1)}. ${e} ${v.help}\n\n` ++
        `**Impact:** ${impactLabel(v.impact)}\n\n` ++
        `**Description:** ${v.description}\n\n` ++
        `**Instances:** ${Int.toString(Array.length(v.nodes))}\n\n` ++
        `**Learn more:** ${v.helpUrl}\n\n`
      })
      ->Array.join("")
    let more = if Array.length(result.violations) > 10 {
      `\n*... and ${Int.toString(Array.length(result.violations) - 10)} more violations*\n\n`
    } else {
      ""
    }
    header ++ body ++ more
  } else {
    ""
  }

  let footer =
    `\n---\n\n` ++
    `[View full report](https://accessibility-everywhere.org/report?url=${encodeURIComponent(url)})\n`

  head ++ violations ++ footer
}

let postPRComment = async (token: string, result: scanResult, url: string, wcagLevel: wcagLevel) => {
  let octokit = Github.getOctokit(token)
  let context = Github.context
  switch context.payload.pull_request {
  | None => ()
  | Some(pr) => {
      let summary = generateSummary(result, url, wcagLevel)
      await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
        body: summary,
      })
    }
  }
}

let run = async () => {
  try {
    let url = Core.getInputWith("url", {required: true})
    let wcagLevel = Core.getInputBare("wcag-level")->parseWcagLevel
    let failOnViolations = Core.getInputBare("fail-on-violations") === "true"
    let minScore = Core.getInputBare("min-score")->Int.fromString->Option.getOr(0)
    let commentPR = Core.getInputBare("comment-pr") === "true"
    let githubToken = Core.getInputBare("github-token")

    Core.info(`Scanning ${url} for WCAG ${wcagLabel(wcagLevel)} compliance...`)

    let scanner = Scanner.createScanner()
    let result = await scanner->Scanner.scan({url, wcagLevel, screenshot: false})

    Core.setOutputInt("score", result.score)
    Core.setOutputInt("violations", Array.length(result.violations))
    Core.setOutputInt("passes", Array.length(result.passes))
    Core.setOutputStr(
      "report-url",
      `https://accessibility-everywhere.org/report?url=${encodeURIComponent(url)}`,
    )

    let summary = generateSummary(result, url, wcagLevel)
    let _ = await Core.addRaw(summary)->Core.write

    if (
      commentPR &&
      githubToken !== "" &&
      Github.context.payload.pull_request !== None
    ) {
      await postPRComment(githubToken, result, url, wcagLevel)
    }

    let bar = "============================================================"
    Core.info(`\n${bar}`)
    Core.info(`Accessibility Score: ${Int.toString(result.score)}/100`)
    Core.info(`Violations: ${Int.toString(Array.length(result.violations))}`)
    Core.info(`Passes: ${Int.toString(Array.length(result.passes))}`)
    Core.info(`Incomplete: ${Int.toString(Array.length(result.incomplete))}`)
    Core.info(`${bar}\n`)

    if Array.length(result.violations) > 0 {
      Core.warning(
        `Found ${Int.toString(Array.length(result.violations))} accessibility violations:`,
      )
      result.violations->Array.forEachWithIndex((v, i) => {
        Core.warning(
          `${Int.toString(i + 1)}. [${impactLabel(v.impact)->String.toUpperCase}] ${v.description}`,
        )
        Core.warning(`   Help: ${v.helpUrl}`)
        Core.warning(`   Instances: ${Int.toString(Array.length(v.nodes))}`)
      })
    }

    if failOnViolations && Array.length(result.violations) > 0 {
      Core.setFailed(
        `Found ${Int.toString(Array.length(result.violations))} accessibility violations`,
      )
    }

    if minScore > 0 && result.score < minScore {
      Core.setFailed(
        `Accessibility score ${Int.toString(result.score)} is below minimum required score ${Int.toString(minScore)}`,
      )
    }

    if Array.length(result.violations) === 0 && result.score >= minScore {
      Core.info("✓ Accessibility check passed!")
    }
  } catch {
  | Exn.Error(err) =>
    Core.setFailed(`Action failed: ${Exn.message(err)->Option.getOr("unknown error")}`)
  }
}

let _ = run()
