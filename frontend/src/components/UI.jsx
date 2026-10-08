import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon.jsx";
import { titleCase, initials } from "../lib/format.js";

export function Button({
  children,
  icon,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
export function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required,
  options,
  placeholder,
  ...props
}) {
  const { className: _className, ...inputProps } = props;
  const generatedId = useId();
  const id = props.id || generatedId;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {options ? (
        <select
          id={id}
          value={value ?? ""}
          onChange={onChange}
          required={required}
          {...inputProps}
        >
          <option value="">
            {placeholder || `Select ${label.toLowerCase()}`}
          </option>
          {options.map((option) =>
            typeof option === "string" ? (
              <option key={option} value={option}>
                {titleCase(option)}
              </option>
            ) : (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ),
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...inputProps}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...inputProps}
        />
      )}
      {hint && <small className="field__hint">{hint}</small>}
    </div>
  );
}
export function Dialog({
  title,
  children,
  footer,
  onClose,
  drawer = false,
  open = true,
  initialFocusRef,
}) {
  const ref = useRef(null);
  const returnFocusRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const activeElement = document.activeElement;
      returnFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (returnFocusRef.current?.isConnected)
        returnFocusRef.current.focus();
      returnFocusRef.current = null;
    };
  }, [initialFocusRef, open]);
  function keepFocusInside(event) {
    if (event.key !== "Tab") return;
    const dialog = ref.current;
    if (!dialog?.open) return;
    const focusable = Array.from(
      dialog.querySelectorAll(
        'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`dialog${drawer ? " dialog--drawer" : ""}`}
      onKeyDown={keepFocusInside}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="dialog__header">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" aria-label="Close" onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
      </div>
      <div className="dialog__body">{children}</div>
      {footer && <div className="dialog__footer">{footer}</div>}
    </dialog>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  titleIcon,
}) {
  return (
    <header className="page-heading">
      {eyebrow && <div className="page-heading__eyebrow">{eyebrow}</div>}
      <div className="page-heading__row">
        {titleIcon && <Icon name={titleIcon} size={20} />}
        <h1 className="page-heading__title">{title}</h1>
        {actions && <div className="page-heading__actions">{actions}</div>}
      </div>
      {description && (
        <p className="page-heading__description">{description}</p>
      )}
    </header>
  );
}
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel__header">
        <h2 className="panel__title">{title}</h2>
        {action}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}
export function EmptyState({ icon = "box", title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Notice({ children, tone = "info" }) {
  return (
    <div
      className={`notice notice--${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Status({ value }) {
  const kind = String(value || "unknown")
    .toLowerCase()
    .replaceAll("_", "-");
  return (
    <span className={`status-pill status-pill--${kind}`}>
      {titleCase(value)}
    </span>
  );
}
export function PersonAvatar({ person, size = 30 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size }}
      aria-label={person?.name || "Unknown person"}
    >
      {initials(person?.name || person?.email)}
    </span>
  );
}
export function Loading({ label = "Loading your workspace…" }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-state__spinner" />
      {label}
    </div>
  );
}
