export default function SemiProgress({ value, estado }) {
  // Map order estado (string) to percentage and color
  function mapEstado(s){
    // if a numeric override is provided, use it
    if(!s && typeof value === 'number') return { pct: Math.max(0, Math.min(100, value)), color: '#8f952f' }
    const st = String(s || '').toLowerCase().trim()
    // Map states explicitly to the requested percentages/colors
    const deliveredSyn = ['entregado','delivered','served','servido','completado','completed','finalizado','finalizada']
    const listoSyn = ['listo','ready','prepared']
    const preparandoSyn = ['preparando','preparacion','preparing','in_preparation']
    const pendienteSyn = ['pendiente','pending','nuevo','new']
    const canceledSyn = ['cancelado','cancelada','cancelled','canceled']

    if(deliveredSyn.includes(st)) return { pct: 100, color: '#059669' } // entregado
    if(listoSyn.includes(st)) return { pct: 90, color: '#10b981' } // listo
    if(preparandoSyn.includes(st)) return { pct: 50, color: '#3b82f6' } // preparando
    if(pendienteSyn.includes(st)) return { pct: 10, color: '#f59e0b' } // pendiente
    if(canceledSyn.includes(st)) return { pct: 0, color: '#ef4444' } // cancelado

    // fallback: try numeric value
    const num = Number(s)
    if(!Number.isNaN(num)) return { pct: Math.max(0, Math.min(100, num)), color: '#8f952f' }
    return { pct: 0, color: '#cbd5e1' }
  }

  const radius = 60;
  const stroke = 12;
  const circ = Math.PI * radius; // media circunferencia
  const info = mapEstado(estado ?? value)
  const progress = Math.max(0, Math.min(100, info.pct))
  const dash = (circ * progress) / 100

  return (
    <svg width="200" height="130" viewBox="0 0 200 130">
      <path
        d={`M 40 100 A ${radius} ${radius} 0 0 1 160 100`}
        fill="none"
        stroke="#e6e7e8"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d={`M 40 100 A ${radius} ${radius} 0 0 1 160 100`}
        fill="none"
        stroke={info.color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
      />
      <text x="100" y="90" textAnchor="middle" fontSize="28" fill="#222" fontWeight="700">
        {progress}%
      </text>
    </svg>
  )
}
