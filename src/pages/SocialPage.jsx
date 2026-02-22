import { useMemo, useState } from "react";
import { socialActiveUsers } from "../mocks/socialActiveUsers";

function getInitials(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function StoryViewer({ user, onClose }) {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Story de ${user.nombre}`}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">StoryViewer</p>
            <h2 className="text-xl font-bold text-ink-900">{user.nombre}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-6 text-center text-sm text-ink-600">
          Placeholder del visor de historias.
          <p className="mt-2 font-medium">"{user.floatingMessage}"</p>
        </div>
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const users = useMemo(() => socialActiveUsers, []);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Social</h1>
        <p className="mt-1 text-sm text-ink-500">Usuarios activos en este momento.</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const initials = getInitials(user.nombre);

          return (
            <button
              key={user.user_id}
              type="button"
              onClick={() => setSelectedUser(user)}
              className="relative flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute right-3 top-2 max-w-[65%] truncate rounded-full bg-ink-900 px-2.5 py-1 text-[10px] font-medium text-white shadow">
                {user.floatingMessage}
              </span>

              <div className={`relative rounded-full p-0.5 ${user.hasStory ? "bg-gradient-to-br from-brand-500 via-pink-500 to-amber-400" : "bg-gray-200"}`}>
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

      <StoryViewer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </section>
  );
}