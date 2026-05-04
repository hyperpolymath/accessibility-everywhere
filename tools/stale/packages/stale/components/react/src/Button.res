type variant = [#primary | #secondary | #ghost | #danger]
type size = [#sm | #md | #lg]

type props = {
  variant?: variant,
  size?: size,
  loading?: bool,
  disabled?: bool,
  iconBefore?: React.element,
  iconAfter?: React.element,
  children?: React.element,
  className?: string,
  \"type"?: string,
  onClick?: JsxEvent.Mouse.t => unit,
  ariaLabel?: string,
}

let variantClass = v =>
  switch v {
  | #primary => "a11y-button--primary"
  | #secondary => "a11y-button--secondary"
  | #ghost => "a11y-button--ghost"
  | #danger => "a11y-button--danger"
  }

let sizeClass = s =>
  switch s {
  | #sm => "a11y-button--sm"
  | #md => "a11y-button--md"
  | #lg => "a11y-button--lg"
  }

let make = React.forwardRef((props: props, ref) => {
  let variant = props.variant->Option.getOr(#primary)
  let size = props.size->Option.getOr(#md)
  let loading = props.loading->Option.getOr(false)
  let disabled = props.disabled->Option.getOr(false)
  let className = props.className->Option.getOr("")
  let type_ = props.\"type"->Option.getOr("button")
  let busy = disabled || loading

  let classes =
    [
      "a11y-button",
      variantClass(variant),
      sizeClass(size),
      loading ? "a11y-button--loading" : "",
      className,
    ]
    ->Array.filter(s => s !== "")
    ->Array.join(" ")

  let domRef = ref->Nullable.toOption->Option.map(ReactDOM.Ref.domRef)

  <button
    ref=?domRef
    type_
    className={classes}
    disabled=busy
    ariaDisabled=busy
    ariaBusy=loading
    onClick=?{props.onClick}
    ariaLabel=?{props.ariaLabel}>
    {loading
      ? <span className="a11y-button__spinner" ariaHidden=true />
      : React.null}
    {switch (loading, props.iconBefore) {
    | (false, Some(icon)) =>
      <span className="a11y-button__icon-before" ariaHidden=true> {icon} </span>
    | _ => React.null
    }}
    <span className="a11y-button__text"> {props.children->Option.getOr(React.null)} </span>
    {switch (loading, props.iconAfter) {
    | (false, Some(icon)) =>
      <span className="a11y-button__icon-after" ariaHidden=true> {icon} </span>
    | _ => React.null
    }}
  </button>
})
