// lib/api.ts - API utility functions with basePath support

const getBasePath = () => {
  if (typeof window !== 'undefined') {
    // Client-side: get basePath from the current URL
    const path = window.location.pathname;
    if (path.startsWith('/readmyname')) {
      return '/readmyname';
    }
  } else {
    // Server-side: use environment
    return process.env.NODE_ENV === 'production' ? '/readmyname' : '';
  }
  return '';
};

export const apiUrl = (path: string): string => {
  const basePath = getBasePath();
  return `${basePath}${path}`;
};

export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(path), options);
};