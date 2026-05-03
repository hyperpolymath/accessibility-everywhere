type modalSize = [#sm | #md | #lg | #full]

module DomFFI = {
  type document
  type keyboardEvent = {key: string, shiftKey: bool}

  @val external document: document = "document"
  @get external activeElement: document => Js.Nullable.t<Dom.element> = "activeElement"
  @get external body: document => Dom.element = "body"
  @get external style: Dom.element => {..} = "style"
  @get external overflow: {..} => string = "overflow"
  @set external setOverflow: ({..}, string) => unit = "overflow"

  @send external focus: Dom.element => unit = "focus"
  @send
  external querySelectorAll: (Dom.element, string) => array<Dom.element> = "querySelectorAll"
  @send
  external addKeyListener: (document, @as("keydown") _, keyboardEvent => unit) => unit =
    "addEventListener"
  @send
  external removeKeyListener: (document, @as("keydown") _, keyboardEvent => unit) => unit =
    "removeEventListener"
  @send external preventDefault: keyboardEvent => unit = "preventDefault"
}

let getFocusableElements = (container: option<Dom.element>): array<Dom.element> =>
  switch container {
  | None => []
  | Some(el) => {
      let selector =
        [
          "button:not([disabled])",
          "[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex=\"-1\"])",
        ]->Array.join(",")
      DomFFI.querySelectorAll(el, selector)
    }
  }

let getFirstFocusable = container => getFocusableElements(container)->Array.get(0)

@react.component
let make = (
  ~isOpen: bool,
  ~onClose: unit => unit,
  ~title: string,
  ~children: React.element,
  ~size: modalSize=#md,
  ~closeOnOverlayClick: bool=true,
  ~closeOnEscape: bool=true,
  ~initialFocusRef: option<React.ref<Js.Nullable.t<Dom.element>>>=?,
  ~className: string="",
) => {
  let titleId = React.useId()
  let contentId = React.useId()
  let overlayRef = React.useRef(Js.Nullable.null: Js.Nullable.t<Dom.element>)
  let modalRef = React.useRef(Js.Nullable.null: Js.Nullable.t<Dom.element>)
  let previousFocusRef = React.useRef(Js.Nullable.null: Js.Nullable.t<Dom.element>)
  let (mounted, setMounted) = React.useState(() => false)

  React.useEffect0(() => {
    setMounted(_ => true)
    Some(() => setMounted(_ => false))
  })

  React.useEffect2(() => {
    if isOpen {
      previousFocusRef.current = DomFFI.activeElement(DomFFI.document)
      let modalCurrent = modalRef.current->Js.Nullable.toOption
      let initial = switch initialFocusRef {
      | Some(r) => r.current->Js.Nullable.toOption
      | None => None
      }
      let target = switch initial {
      | Some(_) as s => s
      | None => getFirstFocusable(modalCurrent)
      }
      target->Option.forEach(DomFFI.focus)
      Some(
        () =>
          previousFocusRef.current
          ->Js.Nullable.toOption
          ->Option.forEach(DomFFI.focus),
      )
    } else {
      None
    }
  }, (isOpen, initialFocusRef))

  React.useEffect3(() => {
    if isOpen && closeOnEscape {
      let handleEscape = (e: DomFFI.keyboardEvent) =>
        if e.key === "Escape" {
          onClose()
        }
      DomFFI.addKeyListener(DomFFI.document, handleEscape)
      Some(() => DomFFI.removeKeyListener(DomFFI.document, handleEscape))
    } else {
      None
    }
  }, (isOpen, closeOnEscape, onClose))

  React.useEffect1(() => {
    if isOpen {
      let handleTab = (e: DomFFI.keyboardEvent) =>
        if e.key === "Tab" {
          let modalCurrent = modalRef.current->Js.Nullable.toOption
          let focusable = getFocusableElements(modalCurrent)
          let len = Array.length(focusable)
          if len > 0 {
            let first = focusable->Array.getUnsafe(0)
            let last = focusable->Array.getUnsafe(len - 1)
            let active = DomFFI.activeElement(DomFFI.document)->Js.Nullable.toOption
            if e.shiftKey {
              if active === Some(first) {
                DomFFI.preventDefault(e)
                DomFFI.focus(last)
              }
            } else if active === Some(last) {
              DomFFI.preventDefault(e)
              DomFFI.focus(first)
            }
          }
        }
      DomFFI.addKeyListener(DomFFI.document, handleTab)
      Some(() => DomFFI.removeKeyListener(DomFFI.document, handleTab))
    } else {
      None
    }
  }, [isOpen])

  React.useEffect1(() => {
    if isOpen {
      let body = DomFFI.body(DomFFI.document)
      let originalOverflow = DomFFI.overflow(DomFFI.style(body))
      DomFFI.setOverflow(DomFFI.style(body), "hidden")
      Some(() => DomFFI.setOverflow(DomFFI.style(body), originalOverflow))
    } else {
      None
    }
  }, [isOpen])

  let handleOverlayClick = (e: JsxEvent.Mouse.t) => {
    if closeOnOverlayClick {
      let target: Dom.element = e->JsxEvent.Mouse.target->Obj.magic
      switch overlayRef.current->Js.Nullable.toOption {
      | Some(o) if o === target => onClose()
      | _ => ()
      }
    }
  }

  if !isOpen || !mounted {
    React.null
  } else {
    let sizeClass = switch size {
    | #sm => "a11y-modal--sm"
    | #md => "a11y-modal--md"
    | #lg => "a11y-modal--lg"
    | #full => "a11y-modal--full"
    }
    let modalClasses =
      ["a11y-modal", sizeClass, className]
      ->Array.filter(s => s !== "")
      ->Array.join(" ")

    let modal =
      <div
        ref={ReactDOM.Ref.domRef(overlayRef)}
        className="a11y-modal-overlay"
        onClick={handleOverlayClick}
        role="presentation">
        <div
          ref={ReactDOM.Ref.domRef(modalRef)}
          className={modalClasses}
          role="dialog"
          ariaModal=true
          ariaLabelledby={titleId}
          ariaDescribedby={contentId}>
          <div className="a11y-modal__header">
            <h2 id={titleId} className="a11y-modal__title"> {React.string(title)} </h2>
            <button
              type_="button"
              className="a11y-modal__close"
              onClick={_ => onClose()}
              ariaLabel="Close dialog">
              <span ariaHidden=true> {React.string(`×`)} </span>
            </button>
          </div>
          <div id={contentId} className="a11y-modal__content"> {children} </div>
        </div>
      </div>

    ReactDOM.createPortal(modal, DomFFI.body(DomFFI.document))
  }
}
