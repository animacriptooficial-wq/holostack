import { useEffect, useState } from 'react';
import { fetchData } from '../services/apiService';
import { useStore } from '../store';

export const useData = (endpoint: string) => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useStore((state) => state.loading);
  const setLoading = useStore((state) => state.setLoading);

  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const result = await fetchData(endpoint);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [endpoint, setLoading]);

  return { data, error, loading };
};
