import { useEffect } from 'react';

/**
 * Sets the page <title> and meta description dynamically.
 * @param {string} title - The page title
 * @param {string} description - The meta description
 */
export default function useSEO(title, description) {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    // Set meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
}