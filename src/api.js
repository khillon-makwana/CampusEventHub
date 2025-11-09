// src/api.js

const API_BASE = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost/CampusEventHub/backend/api';

console.log("API_BASE =", API_BASE);

// --- FUNCTION TO HANDLE FILE UPLOADS ---
export async function apiPostFormData(path, formData) {
  const url = `${API_BASE}/${path}`;
  console.log('POST (FormData) to:', url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData // No 'Content-Type' header, browser sets it
    });

    console.log('Response status:', res.status);
    
    // Check content type
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Expected JSON but got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    const data = await res.json();
    
    if (!res.ok) {
        // Pass along validation errors
        if (res.status === 422 && data.errors) {
            throw { status: 422, errors: data.errors };
        }
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }

    return data;

  } catch (error) {
    console.error('apiPostFormData error:', error);
    throw error;
  }
}

// --- UPDATED FUNCTION ---
export async function apiPost(path, data) {
  const url = `${API_BASE}/${path}`;
  console.log('POST to:', url);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    console.log('Response status:', res.status);
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Expected JSON but got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    // Read the JSON body regardless of the status
    const json = await res.json();

    if (!res.ok) {
      // Create a richer error object that includes the JSON data and status
      const error = new Error(json.error || `HTTP error! status: ${res.status}`);
      error.data = json; // Attach the full JSON response
      error.status = res.status; // Attach the status code
      throw error; // Throw the new, enriched error
    }

    return json; // Return success JSON
  } catch (error) {
    console.error('apiPost error:', error);
    throw error;
  }
}

export async function apiGet(path) {
  const url = `${API_BASE}/${path}`;
  console.log('GET from:', url);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Response status:', res.status);
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Expected JSON but got:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP error! status: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error('apiGet error:', error);
    throw error;
  }
}