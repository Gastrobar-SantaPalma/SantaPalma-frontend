export default function SemiProgress({ value=73 }) {
  const radius = 60;
  const stroke = 12;
  const cx = 80, cy = 80; // centrado
  const circ = Math.PI * radius; // solo media circunferencia visible
  const progress = Math.max(0, Math.min(100, value));
  const dash = (circ * progress) / 100;

  return (
    <svg width="200" height="130" viewBox="0 0 200 130">
      {/* fondo tarjeta */}
      {/* arco gris claro */}
      <path
        d={`M 40 100 A ${radius} ${radius} 0 0 1 160 100`}
        fill="none"
        stroke="#cfd1d4"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* arco progreso oliva */}
      <path
        d={`M 40 100 A ${radius} ${radius} 0 0 1 160 100`}
        fill="none"
        stroke="#8f952f"               // brand-600
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
      />
      {/* % */}
      <text x="100" y="90" textAnchor="middle" fontSize="28" fill="#222" fontWeight="700">
        {progress}%
      </text>
    </svg>
  );
}
