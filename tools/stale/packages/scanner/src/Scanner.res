type wcagLevel = [#A | #"AA" | #"AAA"]
type engine = [#puppeteer | #playwright]
type impact = [#critical | #serious | #moderate | #minor]

type scanOptions = {
  url: string,
  wcagLevel: wcagLevel,
  screenshot?: bool,
  engine?: engine,
}

type nodeDetail = {
  html: string,
  target: array<string>,
  failureSummary?: string,
}

type violationDetail = {
  id: string,
  impact: impact,
  description: string,
  help: string,
  helpUrl: string,
  tags: array<string>,
  nodes: array<nodeDetail>,
}

type passDetail = {
  id: string,
  description: string,
  help: string,
  tags: array<string>,
  nodes: array<nodeDetail>,
}

type incompleteDetail = {
  id: string,
  description: string,
  help: string,
  nodes: array<nodeDetail>,
}

type inapplicableDetail = {
  id: string,
  description: string,
  help: string,
}

type scanResult = {
  url: string,
  timestamp: string,
  score: int,
  duration: int,
  wcagLevel: wcagLevel,
  violations: array<violationDetail>,
  passes: array<passDetail>,
  incomplete: array<incompleteDetail>,
  inapplicable: array<inapplicableDetail>,
  screenshot?: string,
}

module Puppeteer = {
  type browser
  type page
  type launchOptions = {headless?: bool, args?: array<string>}

  @module("puppeteer") external launch: launchOptions => promise<browser> = "launch"
  @send external newPage: browser => promise<page> = "newPage"
  @send external close: browser => promise<unit> = "close"
}

module Playwright = {
  type browser
  type page

  @module("playwright") @scope("chromium")
  external launch: {..} => promise<browser> = "launch"
}

module Fs = {
  @module("fs") external readFileSync: (string, @as("utf8") _) => string = "readFileSync"
}

@val external require: {..} = "require"
@send external resolve: ({..}, string) => string = "resolve"

type t = {axeSource: string}

let make = (): t => {
  let path = require->resolve("axe-core/axe.min.js")
  {axeSource: Fs.readFileSync(path)}
}

let calculateScore = (_axeResults: {..}): int => {
  // SCORING KERNEL: penalty weights per impact:
  // critical = 10, serious = 5, moderate = 3, minor = 1.
  // TODO: implement weighted score from violation nodes.
  failwith("TODO: calculateScore not yet implemented")
}

let scanWithPuppeteer = async (
  _self: t,
  _options: scanOptions,
  _startTime: float,
): scanResult => {
  // TODO: launch headless Chromium, navigate, inject axeSource, run axe.run with WCAG tags, capture screenshot.
  failwith("TODO: scanWithPuppeteer not yet implemented")
}

let scan = async (self: t, options: scanOptions): scanResult => {
  let startTime = Date.now()
  let engine = options.engine->Option.getOr(#puppeteer)
  switch engine {
  | #puppeteer => await scanWithPuppeteer(self, options, startTime)
  | #playwright => failwith("TODO: scanWithPlaywright not yet implemented")
  }
}

let createScanner = make
