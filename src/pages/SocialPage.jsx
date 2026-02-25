import { useState } from "react";
import { fetchActiveUsers, fetchStoryPeople, fetchStoryThemes, fetchUserStories } from "../api/socialApi";
import ActiveUsersGrid from "../components/social/ActiveUsersGrid";
import StoriesBar from "../components/social/StoriesBar";
import StoryViewer from "../components/social/StoryViewer";
import ThemesBar from "../components/social/ThemesBar";
import { usePolling } from "../hooks/usePolling";

export default function SocialPage() {
  const venueId = 1; // TODO: Obtener venueId dinámicamente desde contexto/ruta.
  const activeUsers = usePolling(fetchActiveUsers, 30000, true);
  const storyPeople = usePolling(() => fetchStoryPeople(venueId), 30000, true);
  const themes = usePolling(() => fetchStoryThemes(venueId), 30000, true);

  const [selectedStoryUser, setSelectedStoryUser] = useState(null);
  const [selectedUserStories, setSelectedUserStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);

  const openStoryViewer = async (user) => {
    if (!user?.user_id) return;

    setSelectedStoryUser(user);
    setLoadingStories(true);
    try {
       const stories = await fetchUserStories(venueId, user.user_id);
      setSelectedUserStories(stories);
    } catch {
      setSelectedUserStories([]);
    } finally {
      setLoadingStories(false);
    }
  };
  const closeStoryViewer = () => {
    setSelectedStoryUser(null);
    setSelectedUserStories([]);
    setLoadingStories(false);
  };
  const hasBlockingLoading = activeUsers.loading && storyPeople.loading && themes.loading;
  const hasBlockingError = activeUsers.error && storyPeople.error && themes.error;
  if (hasBlockingLoading) return <div>Cargando Social...</div>;
  if (hasBlockingError) return <div>Error cargando Social.</div>;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Social</h1>
        <p className="mt-1 text-sm text-ink-500">Usuarios activos en este momento.</p>
      </header>
      <StoriesBar people={storyPeople.data} onSelect={openStoryViewer} />
      <ThemesBar themes={themes.data} onSelect={() => {}} />
      <ActiveUsersGrid users={activeUsers.data} onSelect={openStoryViewer} />
      {loadingStories && selectedStoryUser ? (
        <div className="fixed inset-0 z-[85] grid place-items-center bg-black/70 text-sm font-medium text-white">Cargando historias...</div>
      ) : null}
       <StoryViewer
        isOpen={Boolean(selectedStoryUser) && !loadingStories}
        user={selectedStoryUser}
        stories={selectedUserStories}
        onClose={closeStoryViewer}
      />
    </section>
  );}