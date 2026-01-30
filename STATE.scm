;; SPDX-License-Identifier: MPL-2.0-or-later
;; STATE.scm - Project state for accessibility-everywhere

(state
  (metadata
    (version "0.2.0")
    (schema-version "1.0")
    (created "2024-06-01")
    (updated "2025-01-16")
    (project "accessibility-everywhere")
    (repo "hyperpolymath/accessibility-everywhere"))

  (project-context
    (name "Accessibility Everywhere")
    (tagline "Making web accessibility a search engine ranking factor")
    (tech-stack ("javascript" "react" "node" "express" "arangodb" "puppeteer")))

  (current-position
    (phase "foundation")
    (overall-completion 20)
    (components
      ((browser-extension . 30)
       (testing-dashboard . 20)
       (monitoring-api . 15)
       (github-action . 25)
       (cli-tool . 20)
       (npm-scanner . 15)
       (web-standards . 10)))
    (working-features
      ("Chrome/Firefox extension framework"
       "WCAG Level A/AA/AAA testing via axe-core"
       "Public testing dashboard concept"
       "REST API design"
       "Proposed web standards (Accessibility-Policy header)")))

  (route-to-mvp
    (milestones
      ((name "Phase 1: Foundation")
       (status "in-progress")
       (items
         ("Core tools built"
          "Documentation"
          "Public launch"
          "Initial user base")))
      ((name "Phase 2: Integration")
       (status "pending")
       (items
         ("GitHub Action"
          "npm package"
          "CI/CD integration")))
      ((name "Phase 3: Standards")
       (status "pending")
       (items
         ("W3C proposal"
          "Search engine partnerships"
          "Industry adoption")))))

  (blockers-and-issues
    (critical ())
    (high ())
    (medium
      (("Implementation" . "Mostly documentation, minimal implementation")))
    (low ()))

  (critical-next-actions
    (immediate
      ("Implement browser extension core"))
    (this-week
      ("Build axe-core integration"))
    (this-month
      ("Launch public testing dashboard"))))
