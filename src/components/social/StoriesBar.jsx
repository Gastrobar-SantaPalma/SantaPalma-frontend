function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function StoriesBar({ people = [], onSelect }) {
  if (!people.length) {
    return <p className="text-sm text-ink-500">No hay historias disponibles.</p>;
  }

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max items-start gap-4">
        {people.map((person) => {
          const initials = getInitials(person.nombre);

          return (
            <button
              key={`story-${person.user_id}`}
              type="button"
              onClick={() => onSelect?.(person)}
              className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
              aria-label={`Ver story de ${person.nombre}`}
            >
              <div
                className={`rounded-full p-0.5 transition group-hover:scale-105 ${
                  person.hasStory ? "bg-gradient-to-br from-brand-500 via-pink-500 to-amber-400" : "bg-gray-200"
                }`}
              >
                <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-100">
                  {person.foto ? (
                    <img src={person.foto} alt={person.nombre} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-bold text-brand-700">
                      {initials}
                    </div>
                  )}
                </div>
              </div>
              <p className="line-clamp-2 text-xs font-medium text-ink-700">{person.nombre}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}