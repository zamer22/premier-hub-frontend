type ChipItem = { key: string; label: string; count?: number };

type Props = {
  items: ChipItem[];
  value: string;
  onChange: (key: string) => void;
};

export default function ChipGroup({ items, value, onChange }: Props) {
  return (
    <div className="adm-store-chips">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={value === item.key ? "adm-store-chip is-active" : "adm-store-chip"}
        >
          <span>{item.label}</span>
          {item.count !== undefined && <b>{item.count}</b>}
        </button>
      ))}
    </div>
  );
}
