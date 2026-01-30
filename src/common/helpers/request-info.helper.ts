import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { LocationInfo } from '../interfaces/location-info.interface';

export interface RequestClientInfo {
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  location: LocationInfo | null;
}

export const getClientInfo = async (
  req: Request,
): Promise<RequestClientInfo> => {
  let ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '';

  if (ip === '::1') ip = '127.0.0.1';

  ip = ip.replace('::ffff:', '').trim();

  const ua = req.headers['user-agent'] || '';
  const result = UAParser(ua);

  const location = await getIPLocation(ip);

  return {
    ip,
    userAgent: ua,
    browser:
      `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    device:
      result.device.type || (ua.includes('Mobile') ? 'Mobile' : 'Desktop'),
    location: location || null,
  };
};

const getIPLocation = async (ip: string): Promise<LocationInfo | null> => {
  try {
    const res = await fetch(`https://ip.guide/${ip}`);
    const data = await res.json();

    return {
      city: data.location.city,
      country: data.location.country,
      timezone: data.location.timezone,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    return null;
  }
};
