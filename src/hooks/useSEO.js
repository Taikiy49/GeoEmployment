import { useEffect } from 'react';

const PUBLIC_SITE_URL = 'https://careers.geolabs.net';
const SOCIAL_IMAGE_URL = `${PUBLIC_SITE_URL}/geolabs-logo.png`;

function setMeta(selector, attribute, value, createAttributes) {
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(createAttributes).forEach(([key, item]) => element.setAttribute(key, item));
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

export default function useSEO(title, description) {
  useEffect(() => {
    if (title) document.title = title;

    const path = window.location.pathname === '/' ? '/' : window.location.pathname.replace(/\/+$/, '');
    const publicUrl = `${PUBLIC_SITE_URL}${path}`;
    const isAdminDomain = window.location.hostname === 'admin.geolabs.net'
      || window.location.hostname.startsWith('admin.');

    setMeta('meta[name="description"]', 'content', description, { name: 'description' });
    setMeta('meta[name="robots"]', 'content', isAdminDomain ? 'noindex, nofollow' : 'index, follow, max-image-preview:large', { name: 'robots' });
    setMeta('meta[property="og:title"]', 'content', title, { property: 'og:title' });
    setMeta('meta[property="og:description"]', 'content', description, { property: 'og:description' });
    setMeta('meta[property="og:url"]', 'content', publicUrl, { property: 'og:url' });
    setMeta('meta[property="og:image"]', 'content', SOCIAL_IMAGE_URL, { property: 'og:image' });
    setMeta('meta[name="twitter:title"]', 'content', title, { name: 'twitter:title' });
    setMeta('meta[name="twitter:description"]', 'content', description, { name: 'twitter:description' });
    setMeta('meta[name="twitter:image"]', 'content', SOCIAL_IMAGE_URL, { name: 'twitter:image' });

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', publicUrl);
  }, [title, description]);
}
