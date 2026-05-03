type wcagLevel = [#A | #"AA" | #"AAA"]
type impact = [#critical | #serious | #moderate | #minor]

type nodeDetail = {target: array<string>}
type violationDetail = {
  impact: impact,
  description: string,
  help: string,
  helpUrl: string,
  nodes: array<nodeDetail>,
  tags: array<string>,
}
type passDetail = {description: string}
type incompleteDetail = {description: string}

type scanOptions = {
  url: string,
  wcagLevel: wcagLevel,
  screenshot?: bool,
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

module Commander = {
  type t
  type cmd

  @module("commander") @new external make: unit => t = "Command"
  @send external setName: (t, string) => t = "name"
  @send external setDescription: (t, string) => t = "description"
  @send external setVersion: (t, string) => t = "version"
  @send external command: (t, string) => cmd = "command"
  @send external descriptionCmd: (cmd, string) => cmd = "description"
  @send external argument: (cmd, string, string) => cmd = "argument"
  @send external option: (cmd, string, string) => cmd = "option"
  @send external optionWithDefault: (cmd, string, string, string) => cmd = "option"
  @send external action: (cmd, (string, {..}) => promise<unit>) => cmd = "action"
  @send external parse: t => unit = "parse"
}

module Chalk = {
  type c
  @module("chalk") external default: c = "default"
  @send external red: (c, string) => string = "red"
  @send external green: (c, string) => string = "green"
  @send external yellow: (c, string) => string = "yellow"
  @send external blue: (c, string) => string = "blue"
  @send external gray: (c, string) => string = "gray"
  @send external bold: (c, string) => string = "bold"
  @get external redChain: c => c = "red"
  @get external greenChain: c => c = "green"
  @get external yellowChain: c => c = "yellow"
  @get external blueChain: c => c = "blue"
  @get external boldChain: c => c = "bold"
}

module Ora = {
  type t
  @module("ora") external make: string => t = "default"
  @send external start: t => t = "start"
  @send external succeed: (t, string) => t = "succeed"
  @send external fail: (t, string) => t = "fail"
}

module Table = {
  type t
  type init = {head: array<string>, colWidths: array<int>}
  @module("cli-table3") @new external make: init => t = "default"
  @send external push: (t, array<string>) => unit = "push"
  @send external toString: t => string = "toString"
}

module Fs = {
  type writeJsonOpts = {spaces: int}
  @module("fs-extra") external writeJson: (string, 'a, writeJsonOpts) => promise<unit> = "writeJson"
  @module("fs-extra")
  external readFile: (string, @as("utf-8") _) => promise<string> = "readFile"
  @module("fs-extra") external ensureDir: string => promise<unit> = "ensureDir"
}

module Path = {
  @module("path") external join: (string, string) => string = "join"
}

module Process = {
  @val external exit: int => 'a = "process.exit"
}

@val external consoleLog: string => unit = "console.log"
@val external consoleError: string => unit = "console.error"
@val external jsonStringifyPretty: ('a, Js.Null.t<unit>, int) => string = "JSON.stringify"

let chalk = Chalk.default

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

let bar = String.repeat("=", 70)

let parseWcagLevel = (s): wcagLevel =>
  switch s {
  | "A" => #A
  | "AAA" => #"AAA"
  | _ => #"AA"
  }

let wcagLabel = (w: wcagLevel) =>
  switch w {
  | #A => "A"
  | #"AA" => "AA"
  | #"AAA" => "AAA"
  }

let impactColored = (impact: impact) => {
  let label = switch impact {
  | #critical => "critical"
  | #serious => "serious"
  | #moderate => "moderate"
  | #minor => "minor"
  }
  switch impact {
  | #critical => chalk->Chalk.boldChain->Chalk.red(label)
  | #serious => chalk->Chalk.red(label)
  | #moderate => chalk->Chalk.yellow(label)
  | #minor => chalk->Chalk.blue(label)
  }
}

let scoreColored = score =>
  if score >= 90 {
    chalk->Chalk.boldChain->Chalk.green(Int.toString(score))
  } else if score >= 70 {
    chalk->Chalk.boldChain->Chalk.yellow(Int.toString(score))
  } else {
    chalk->Chalk.boldChain->Chalk.red(Int.toString(score))
  }

let generateMarkdown = (result: scanResult, url: string) => {
  let header = `# Accessibility Report\n\n**URL:** ${url}\n**Score:** ${Int.toString(
      result.score,
    )}/100\n\n## Violations\n\n`
  let body =
    result.violations
    ->Array.mapWithIndex((v, i) =>
      `### ${Int.toString(i + 1)}. ${v.help}\n\n` ++
      `- **Impact:** ${(v.impact :> string)}\n` ++
      `- **Instances:** ${Int.toString(Array.length(v.nodes))}\n` ++
      `- **Help:** ${v.helpUrl}\n\n`
    )
    ->Array.join("")
  header ++ body
}

@get external optLevel: {..} => string = "level"
@get external optScreenshot: {..} => option<bool> = "screenshot"
@get external optOutput: {..} => option<string> = "output"
@get external optFormat: {..} => string = "format"
@get external optMinScore: {..} => string = "minScore"
@get external optFailOnViolations: {..} => option<bool> = "failOnViolations"

let scanAction = async (url: string, options: {..}) => {
  let spinner = Ora.make("Scanning for accessibility issues...")->Ora.start
  try {
    let scanner = Scanner.createScanner()
    let result = await scanner->Scanner.scan({
      url,
      wcagLevel: options->optLevel->parseWcagLevel,
      screenshot: ?options->optScreenshot,
    })
    let _ = spinner->Ora.succeed("Scan complete!")

    consoleLog("\n" ++ bar)
    consoleLog(chalk->Chalk.boldChain->Chalk.blue("Accessibility Report"))
    consoleLog(bar)
    consoleLog(`URL: ${url}`)
    consoleLog(`WCAG Level: ${options->optLevel}`)
    consoleLog(
      `Score: ${scoreColored(result.score)}/100 (Grade ${getGrade(result.score)})`,
    )
    consoleLog(bar ++ "\n")

    let summaryTable = Table.make({
      head: ["Metric", "Count"],
      colWidths: [30, 10],
    })
    summaryTable->Table.push(["✅ Passes", Int.toString(Array.length(result.passes))])
    summaryTable->Table.push([
      "❌ Violations",
      Int.toString(Array.length(result.violations)),
    ])
    summaryTable->Table.push([
      "⚠️  Needs Review",
      Int.toString(Array.length(result.incomplete)),
    ])
    consoleLog(summaryTable->Table.toString ++ "\n")

    if Array.length(result.violations) > 0 {
      consoleLog(
        chalk
        ->Chalk.boldChain
        ->Chalk.red(`Found ${Int.toString(Array.length(result.violations))} violations:\n`),
      )
      let format = options->optFormat
      if format === "table" {
        let violationsTable = Table.make({
          head: ["Impact", "Description", "Instances", "WCAG"],
          colWidths: [12, 50, 10, 15],
        })
        result.violations->Array.forEach(v =>
          violationsTable->Table.push([
            impactColored(v.impact),
            v.description,
            Int.toString(Array.length(v.nodes)),
            v.tags->Array.join(", "),
          ])
        )
        consoleLog(violationsTable->Table.toString)
      } else if format === "markdown" {
        consoleLog(generateMarkdown(result, url))
      } else {
        consoleLog(jsonStringifyPretty(result, Js.Null.empty, 2))
      }
    } else {
      consoleLog(chalk->Chalk.boldChain->Chalk.green("🎉 No violations found! Great job!"))
    }

    switch options->optOutput {
    | Some(out) => {
        await Fs.writeJson(out, result, {spaces: 2})
        consoleLog(chalk->Chalk.gray(`\n✓ Results saved to ${out}`))
      }
    | None => ()
    }

    Process.exit(Array.length(result.violations) > 0 ? 1 : 0)
  } catch {
  | Exn.Error(err) => {
      let _ = spinner->Ora.fail("Scan failed")
      consoleError(chalk->Chalk.red(Exn.message(err)->Option.getOr("unknown error")))
      Process.exit(1)
    }
  }
}

let ciAction = async (url: string, options: {..}) => {
  let spinner = Ora.make("Running CI scan...")->Ora.start
  try {
    let scanner = Scanner.createScanner()
    let result = await scanner->Scanner.scan({
      url,
      wcagLevel: options->optLevel->parseWcagLevel,
    })
    let _ = spinner->Ora.succeed("CI scan complete")

    let minScore = options->optMinScore->Int.fromString->Option.getOr(70)
    let failOnViolations = options->optFailOnViolations->Option.getOr(false)

    consoleLog(`Score: ${Int.toString(result.score)}/100`)
    consoleLog(`Violations: ${Int.toString(Array.length(result.violations))}`)

    if failOnViolations && Array.length(result.violations) > 0 {
      consoleError(
        chalk->Chalk.red(
          `✗ Failed: Found ${Int.toString(Array.length(result.violations))} violations`,
        ),
      )
      Process.exit(1)
    }

    if result.score < minScore {
      consoleError(
        chalk->Chalk.red(
          `✗ Failed: Score ${Int.toString(result.score)} below minimum ${Int.toString(minScore)}`,
        ),
      )
      Process.exit(1)
    }

    consoleLog(chalk->Chalk.green("✓ Passed all checks"))
    Process.exit(0)
  } catch {
  | Exn.Error(err) => {
      let _ = spinner->Ora.fail("CI scan failed")
      consoleError(chalk->Chalk.red(Exn.message(err)->Option.getOr("unknown error")))
      Process.exit(1)
    }
  }
}

let batchAction = async (file: string, options: {..}) => {
  try {
    let raw = await Fs.readFile(file)
    let urls =
      raw
      ->String.split("\n")
      ->Array.map(String.trim)
      ->Array.filter(s => s !== "" && !String.startsWith(s, "#"))

    consoleLog(chalk->Chalk.blue(`Scanning ${Int.toString(Array.length(urls))} URLs...`))

    let outDir = options->optOutput->Option.getOr("./scan-results")
    await Fs.ensureDir(outDir)

    let scanner = Scanner.createScanner()
    let completed = ref(0)
    let failed = ref(0)

    let total = Array.length(urls)
    for i in 0 to total - 1 {
      let url = urls->Array.getUnsafe(i)
      let spinner = Ora.make(`[${Int.toString(i + 1)}/${Int.toString(total)}] ${url}`)->Ora.start
      try {
        let result = await scanner->Scanner.scan({
          url,
          wcagLevel: options->optLevel->parseWcagLevel,
        })
        let safeName = String.replaceRegExp(url, %re("/[^a-z0-9]/gi"), "_") ++ ".json"
        let filepath = Path.join(outDir, safeName)
        await Fs.writeJson(filepath, result, {spaces: 2})
        let _ = spinner->Ora.succeed(`${url} - Score: ${Int.toString(result.score)}`)
        completed := completed.contents + 1
      } catch {
      | Exn.Error(err) => {
          let _ = spinner->Ora.fail(
            `${url} - ${Exn.message(err)->Option.getOr("unknown error")}`,
          )
          failed := failed.contents + 1
        }
      }
    }

    consoleLog(chalk->Chalk.green(`\n✓ Completed: ${Int.toString(completed.contents)}`))
    if failed.contents > 0 {
      consoleLog(chalk->Chalk.red(`✗ Failed: ${Int.toString(failed.contents)}`))
    }
  } catch {
  | Exn.Error(err) => {
      consoleError(chalk->Chalk.red(Exn.message(err)->Option.getOr("unknown error")))
      Process.exit(1)
    }
  }
}

let program =
  Commander.make()
  ->Commander.setName("accessibility-scan")
  ->Commander.setDescription("Command-line tool for accessibility scanning")
  ->Commander.setVersion("1.0.0")

let _ =
  program
  ->Commander.command("scan")
  ->Commander.descriptionCmd("Scan a URL for accessibility issues")
  ->Commander.argument("<url>", "URL to scan")
  ->Commander.optionWithDefault("-l, --level <level>", "WCAG level (A, AA, AAA)", "AA")
  ->Commander.option("-o, --output <file>", "Output file for results (JSON)")
  ->Commander.optionWithDefault("-f, --format <format>", "Output format (json, table, markdown)", "table")
  ->Commander.option("--screenshot", "Take screenshot")
  ->Commander.action(scanAction)

let _ =
  program
  ->Commander.command("ci")
  ->Commander.descriptionCmd("Run accessibility scan for CI/CD")
  ->Commander.argument("<url>", "URL to scan")
  ->Commander.optionWithDefault("-l, --level <level>", "WCAG level (A, AA, AAA)", "AA")
  ->Commander.optionWithDefault("--min-score <score>", "Minimum required score", "70")
  ->Commander.option("--fail-on-violations", "Fail if any violations found")
  ->Commander.action(ciAction)

let _ =
  program
  ->Commander.command("batch")
  ->Commander.descriptionCmd("Scan multiple URLs from a file")
  ->Commander.argument("<file>", "File containing URLs (one per line)")
  ->Commander.optionWithDefault("-l, --level <level>", "WCAG level (A, AA, AAA)", "AA")
  ->Commander.optionWithDefault("-o, --output <dir>", "Output directory for results", "./scan-results")
  ->Commander.action(batchAction)

program->Commander.parse
