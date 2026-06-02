type TabItem<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
};

export default function AdminTabs<T extends string>({ items, value, onChange }: Props<T>) {
  return (
    <div className="adm-tabs">
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={value === t.key ? "adm-tab adm-tab--active" : "adm-tab"}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
