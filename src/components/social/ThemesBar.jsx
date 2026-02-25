export default function ThemesBar({ themes = [], onSelect }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {themes.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onSelect?.(t)}
          className="shrink-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm min-w-[180px] text-left"
        >
          <p className="text-sm font-semibold text-ink-900">{t.label}</p>
          <div className="mt-2 inline-flex items-center rounded-full bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-white">
            {t.activeUsers} usuarios
          </div>
        </button>
      ))}
    </div>
  );
}