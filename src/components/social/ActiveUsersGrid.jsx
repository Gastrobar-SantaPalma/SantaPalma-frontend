function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function ActiveUsersGrid({ users = [], onSelect }) {
  if (!users.length) {
    return <p className="text-sm text-ink-500">No hay usuarios activos.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => {
        const initials = getInitials(user.nombre);

        return (
          <button
            key={user.user_id}
            type="button"
            onClick={() => onSelect?.(user)}
            className="relative flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="absolute right-3 top-2 max-w-[65%] truncate rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-medium text-white shadow">
              {user.floatingMessage}
            </span>

            <div
              className={`relative rounded-full p-0.5 ${
                user.hasStory ? "bg-gradient-to-br from-brand-500 via-pink-500 to-amber-400" : "bg-gray-200"
              }`}
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-brand-100">
                {user.foto ? (
                  <img src={user.foto} alt={user.nombre} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-bold text-brand-700">
                    {initials}
                  </div>
                )}
                <span
                  className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    user.isOnline ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                  aria-label={user.isOnline ? "En línea" : "Desconectado"}
                />
              </div>
            </div>

            <div className="min-w-0 pt-3">
              <p className="truncate text-sm font-semibold text-ink-900">{user.nombre}</p>
              <p className="text-xs text-ink-500">{user.isOnline ? "Online" : "Offline"}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}