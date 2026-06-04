export default function TransferVisual() {
  return (
    <svg viewBox="0 0 320 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {[50, 90, 130, 170].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="rgba(23,36,58,0.05)" strokeWidth="1" />
      ))}
      {[80, 160, 240].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="210" stroke="rgba(23,36,58,0.04)" strokeWidth="1" />
      ))}
      <path d="M 85 132 A 75 75 0 0 1 235 132"
        stroke="rgba(23,36,58,0.10)" strokeWidth="12" strokeLinecap="round" />
      <path d="M 85 132 A 75 75 0 0 1 218 72"
        stroke="#e90052" strokeWidth="12" strokeLinecap="round" />
      <circle cx="160" cy="132" r="56" stroke="rgba(23,36,58,0.07)" strokeWidth="1" strokeDasharray="4 6" />
      <circle cx="160" cy="132" r="38" stroke="rgba(23,36,58,0.04)" strokeWidth="1" />
      <text x="160" y="129" textAnchor="middle" fill="#17243a" fontSize="26" fontWeight="800" fontFamily="inherit" opacity="0.9">73%</text>
      <text x="160" y="148" textAnchor="middle" fill="#6b7280" fontSize="9" fontWeight="700" fontFamily="inherit" letterSpacing="2">PROB.</text>
      <circle cx="60" cy="178" r="18" fill="rgba(23,36,58,0.06)" stroke="rgba(23,36,58,0.14)" strokeWidth="1.5" />
      <circle cx="260" cy="178" r="18" fill="rgba(233,0,82,0.08)" stroke="#e90052" strokeWidth="1.5" />
      <line x1="81" y1="178" x2="238" y2="178" stroke="rgba(23,36,58,0.10)" strokeWidth="1.5" strokeDasharray="5 4" />
      <polyline points="231,171 240,178 231,185" stroke="rgba(23,36,58,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
