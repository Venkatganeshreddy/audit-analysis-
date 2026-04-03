import { useState, useCallback } from 'react';
import { checkConnection, fetchSemesterData, fetchAssessmentData } from '../services/bigqueryApi';

export function useBigQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);

  const testConnection = useCallback(async () => {
    setError(null);
    try {
      const result = await checkConnection();
      setConnected(result.connected);
      setConnectionInfo(result);
      return result.connected;
    } catch (err) {
      setConnected(false);
      setError(err.message);
      return false;
    }
  }, []);

  const fetchData = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const [semData, assData] = await Promise.all([
        fetchSemesterData(filters),
        fetchAssessmentData(filters).catch(() => []),
      ]);
      return { semesterData: semData, assessmentData: assData };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, connected, connectionInfo, testConnection, fetchData };
}
