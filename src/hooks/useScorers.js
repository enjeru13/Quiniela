import { useState, useEffect } from 'react';
import { getWCScorers } from '../lib/footballApi';

export function useScorers() {
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getWCScorers(20)
      .then(setScorers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { scorers, loading, error };
}
