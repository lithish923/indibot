const BASE_URL = import.meta.env.VITE_API_URL;

export const apiFetch = (path, options = {}) => {
  return fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
};