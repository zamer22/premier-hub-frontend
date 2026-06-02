export default function SimulatorVisual() {
  const heights = [52, 68, 82, 56, 96, 72, 42, 88, 64, 78, 50, 100, 66, 54, 44, 74, 88, 62, 40, 76];
  const affected = new Set([4, 11]);
  const barW = 10;
  const gap  = 5.5;
  const startX = 14;
  const baseY  = 178;

  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {[40, 80, 120].map((h) => (
        <line key={h} x1="10" y1={baseY - h} x2="310" y2={baseY - h} stroke="rgba(23,36,58,0.06)" strokeWidth="1" />
      ))}
      <line x1="10" y1={baseY} x2="310" y2={baseY} stroke="rgba(23,36,58,0.14)" strokeWidth="1" />
      {heights.map((h, i) => {
        const x = startX + i * (barW + gap);
        return (
          <rect
            key={i} x={x} y={baseY - h} width={barW} height={h} rx="2.5"
            fill={affected.has(i) ? "#e90052" : "rgba(23,36,58,0.12)"}
          />
        );
      })}
      <text
        x={startX + 4 * (barW + gap) + barW / 2}
        y={baseY - 102}
        textAnchor="middle" fill="#e90052" fontSize="9" fontWeight="800" fontFamily="inherit"
      >+12%</text>
      <circle
        cx={startX + 11 * (barW + gap) + barW / 2}
        cy={baseY - 110}
        r="7" fill="rgba(233,0,82,0.12)" stroke="#e90052" strokeWidth="1"
      />
    </svg>
  );
}
