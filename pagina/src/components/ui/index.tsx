import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Tone = "default" | "accent" | "navy" | "success" | "warning" | "danger" | "info";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cx("ph-button", `ph-button--${variant}`, className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-card", className)} {...props} />;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cx("ph-panel", className)} {...props} />;
}

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cx("ph-badge", tone !== "default" && `ph-badge--${tone}`, className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("ph-input", className)} {...props} />;
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <label className="ph-field">
      <span className="ph-label">{label}</span>
      {children}
      {hint ? <span className="text-[0.76rem] text-muted leading-relaxed">{hint}</span> : null}
    </label>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ph-page-header">
      <div>
        {eyebrow ? <p className="ph-eyebrow">{eyebrow}</p> : null}
        <h1 className="ph-title">{title}</h1>
        {subtitle ? <p className="ph-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ph-empty">
      <strong className="text-[0.98rem] text-[var(--ph-text-strong)]">{title}</strong>
      {description ? <span className="max-w-[34rem] text-sm leading-relaxed">{description}</span> : null}
      {action}
    </div>
  );
}

export function Metric({
  value,
  label,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("ph-metric", className)}>
      <span className="ph-metric-value">{value}</span>
      <span className="ph-metric-label">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("ph-skeleton", className)} />;
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ key: string; label: ReactNode }>;
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="ph-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={value === item.key}
          className={cx("ph-tab", value === item.key && "is-active")}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function Toast({
  ok,
  children,
}: {
  ok?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cx("ph-badge", ok ? "ph-badge--success" : "ph-badge--danger")}>
      {children}
    </div>
  );
}

export function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="ph-modal-backdrop" onClick={onClose}>
      <div className="ph-modal" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
