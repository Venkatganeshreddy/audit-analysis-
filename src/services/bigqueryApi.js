const API_BASE = import.meta.env.VITE_BQ_API_URL || 'http://localhost:3001/api/bigquery';

export async function checkConnection() {
  const res = await fetch(`${API_BASE}/status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Connection check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSemesterData(filters = {}) {
  const res = await fetch(`${API_BASE}/semester`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch semester data: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data || result;
}

export async function fetchAssessmentData(filters = {}) {
  const res = await fetch(`${API_BASE}/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch assessment data: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data || result;
}

export async function fetchAvailableTables() {
  const res = await fetch(`${API_BASE}/tables`);
  if (!res.ok) throw new Error('Failed to fetch tables');
  const result = await res.json();
  return result.tables || [];
}

export async function executeQuery(sql, params = {}) {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Query failed');
  }
  const result = await res.json();
  return result.data || result;
}
