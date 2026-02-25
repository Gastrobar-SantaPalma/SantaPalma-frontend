const SOCIAL_API_BASE = "http://localhost:4000/api/social";

async function fetchJson(path) {
  const response = await fetch(`${SOCIAL_API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Social API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchActiveUsers() {
  const data = await fetchJson("/active-users");
  return Array.isArray(data) ? data : [];
}

export async function fetchStoryPeople(venueId) {
  const data = await fetchJson(`/stories/people?venue_id=${venueId}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchStoryThemes(venueId) {
  const data = await fetchJson(`/stories/themes?venue_id=${venueId}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchUserStories(venueId, userId) {
  const data = await fetchJson(`/stories?venue_id=${venueId}&user_id=${userId}`);
  return Array.isArray(data) ? data : [];
}