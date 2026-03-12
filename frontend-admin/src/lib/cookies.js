const isBrowser = typeof window !== 'undefined';

const serializeCookie = (name, value, options = {}) => {
  const {
    days = 7,
    path = '/',
    sameSite = 'Strict',
    secure = isBrowser && window.location.protocol === 'https:',
  } = options;

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);

  return `${encodedName}=${encodedValue}; expires=${expires}; path=${path}; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
};

export const setCookie = (name, value, options = {}) => {
  if (!isBrowser) return;
  document.cookie = serializeCookie(name, value, options);
};

export const getCookie = (name) => {
  if (!isBrowser) return null;
  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split('; ');
  const found = parts.find((part) => part.startsWith(encodedName));
  if (!found) return null;
  return decodeURIComponent(found.slice(encodedName.length));
};

export const deleteCookie = (name, path = '/') => {
  if (!isBrowser) return;
  const encodedName = encodeURIComponent(name);
  document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Strict`;
};
