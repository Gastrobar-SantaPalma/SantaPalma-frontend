import { useCallback, useEffect, useState } from "react";

export function usePolling(asyncFn, intervalMs = 30000, enabled = true) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    if (!enabled) return;

    try {
      setError(null);
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [asyncFn, enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    run();

    const intervalId = setInterval(run, intervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, intervalMs, run]);

  return { data, loading, error, reload: run };
}