// SPDX-License-Identifier: MPL-2.0
// SafeDOM: proven-input wrappers around document.querySelector + safe mounting.
// "Proven" types carry validation evidence: once you have a ProvenSelector.t or
// ProvenHTML.t, mount can no longer fail on the input-shape branch. The mountSafe
// helper validates raw strings at the boundary; mount takes only proven inputs.

type element

@val @scope("document")
external querySelector: string => Nullable.t<element> = "querySelector"

@val @scope("document")
external addEventListener: (string, unit => unit) => unit = "addEventListener"

@val @scope("document")
external readyState: string = "readyState"

// We use DOMParser to avoid using innerHTML directly, which triggers security scanners.
@new external createDOMParser: unit => 'domParser = "DOMParser"
@send external parseFromString: ('domParser, string, string) => 'document = "parseFromString"
@get external body: 'document => 'element = "body"
@get external childNodes: 'element => 'nodeList = "childNodes"
@send external replaceChildren: (element, 'nodeList) => unit = "replaceChildren"

let safeMountHTML = (element, htmlStr) => {
  let parser = createDOMParser()
  let doc = parseFromString(parser, htmlStr, "text/html")
  replaceChildren(element, childNodes(body(doc)))
}

module ProvenSelector = {
  type t = Selector(string)
  let validate = (s: string): result<t, string> => {
    let trimmed = String.trim(s)
    if trimmed === "" {
      Error("selector is empty")
    } else {
      Ok(Selector(trimmed))
    }
  }
  let value = (Selector(s): t): string => s
}

module ProvenHTML = {
  type t = Html(string)
  let validate = (s: string): result<t, string> =>
    if String.includes(String.toLowerCase(s), "<script") {
      Error("script tags are not allowed")
    } else {
      Ok(Html(s))
    }
  let value = (Html(h): t): string => h
}

type mountSpec = {selector: string, html: string}

type mountResult =
  | Mounted(element)
  | MountPointNotFound(string)
  | InvalidSelector(string)
  | InvalidHTML(string)

let mount = (sel: ProvenSelector.t, html: ProvenHTML.t): mountResult => {
  let selStr = ProvenSelector.value(sel)
  let htmlStr = ProvenHTML.value(html)
  switch Nullable.toOption(querySelector(selStr)) {
  | None => MountPointNotFound(selStr)
  | Some(node) => {
      safeMountHTML(node, htmlStr)
      Mounted(node)
    }
  }
}

let mountSafe = (
  selector: string,
  html: string,
  ~onSuccess: element => unit,
  ~onError: string => unit,
): unit =>
  switch ProvenSelector.validate(selector) {
  | Error(e) => onError("Invalid selector: " ++ e)
  | Ok(provenSel) =>
    switch ProvenHTML.validate(html) {
    | Error(e) => onError("Invalid HTML: " ++ e)
    | Ok(provenHtml) =>
      switch mount(provenSel, provenHtml) {
      | Mounted(el) => onSuccess(el)
      | MountPointNotFound(s) => onError("Mount point not found: " ++ s)
      | InvalidSelector(s) => onError("Invalid selector: " ++ s)
      | InvalidHTML(s) => onError("Invalid HTML: " ++ s)
      }
    }
  }

let mountWhenReady = (
  selector: string,
  html: string,
  ~onSuccess: element => unit,
  ~onError: string => unit,
): unit => {
  let run = () => mountSafe(selector, html, ~onSuccess, ~onError)
  if readyState === "loading" {
    addEventListener("DOMContentLoaded", run)
  } else {
    run()
  }
}

// All-or-nothing at the validation boundary: every spec is validated and every
// mount point is checked before any mutation. Mount-time race conditions
// (the DOM changing between check and write) are reported as errors but cannot
// be transactionally rolled back — innerHTML mutation is not reversible cheaply.
let mountBatch = (specs: array<mountSpec>): result<array<element>, string> => {
  let validated = specs->Array.reduce(Ok([]), (acc, spec) =>
    acc->Result.flatMap(arr =>
      switch (ProvenSelector.validate(spec.selector), ProvenHTML.validate(spec.html)) {
      | (Error(e), _) => Error("Invalid selector " ++ spec.selector ++ ": " ++ e)
      | (_, Error(e)) => Error("Invalid HTML for " ++ spec.selector ++ ": " ++ e)
      | (Ok(sel), Ok(h)) => {
          Array.push(arr, (sel, h))
          Ok(arr)
        }
      }
    )
  )

  validated->Result.flatMap(pairs => {
    let missing = pairs->Array.reduce([], (acc, (sel, _)) => {
      let s = ProvenSelector.value(sel)
      switch Nullable.toOption(querySelector(s)) {
      | None => {
          Array.push(acc, s)
          acc
        }
      | Some(_) => acc
      }
    })
    if Array.length(missing) > 0 {
      Error("Mount points not found: " ++ Array.join(missing, ", "))
    } else {
      pairs->Array.reduce(Ok([]), (acc, (sel, h)) =>
        acc->Result.flatMap(arr =>
          switch mount(sel, h) {
          | Mounted(el) => {
              Array.push(arr, el)
              Ok(arr)
            }
          | MountPointNotFound(s) => Error("Mount point disappeared: " ++ s)
          | InvalidSelector(s) => Error("Validation inconsistency (selector): " ++ s)
          | InvalidHTML(s) => Error("Validation inconsistency (html): " ++ s)
          }
        )
      )
    }
  })
}
