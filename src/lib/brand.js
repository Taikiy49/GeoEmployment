import geolabsLogoUrl from '../../geolabs-logo.png';

export const BRAND_LOGO_URL = geolabsLogoUrl;

export async function getBrandLogoDataUrl() {
  const response = await fetch(BRAND_LOGO_URL);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getBrandLogoBuffer() {
  const response = await fetch(BRAND_LOGO_URL);
  return response.arrayBuffer();
}
