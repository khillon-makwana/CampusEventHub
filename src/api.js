const API_BASE = import.meta.env.VITE_APP_API_BASE_URL; // ✅ matches .env
console.log("API_BASE =", API_BASE); // <- add this line

export async function apiPost(path, data) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

  return res.json();
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

  return res.json();
}
