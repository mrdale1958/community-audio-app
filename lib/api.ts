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
  let url = `${basePath}${path}`;
  // Ensure trailing slash for API endpoints
  if (!url.endsWith('/')) {
    url += '/';
  }
  console.log(`[API URL DEBUG] Original: ${path}, BasePath: ${basePath}, Final: ${url}`);
  return url;
};

export const apiFetch = async (path: string, options?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(path), options);
};

// NextAuth specific URL helper
export const nextAuthUrl = (path: string): string => {
  const basePath = getBasePath();
  // Remove /api/auth prefix if it exists, then add the full basePath + auth path
  const cleanPath = path.replace(/^\/api\/auth/, '');
  const url = `${basePath}/api/auth${cleanPath}`;
  console.log(`[NEXTAUTH URL DEBUG] Original: ${path}, BasePath: ${basePath}, Final: ${url}`);
  return url;
};