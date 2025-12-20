import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export interface RequestClientInfo {
  ip: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
}

export const getClientInfo = (req: Request): RequestClientInfo => {
  // === IP REAL ===
  const ip = (
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket.remoteAddress ||
    req.ip ||
    ''
  )
    .replace('::ffff:', '')
    .trim();

  // === USER AGENT PARSING ===
  const ua = req.headers['user-agent'] || '';

  // ⚠️ IMPORTANTE: UAParser se usa como FUNCIÓN, no como clase
  const result = UAParser(ua);

  const browser =
    `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim();
  const os = `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim();

  // Detectar dispositivo
  const device =
    result.device.type || (ua.includes('Mobile') ? 'Mobile' : 'Desktop');

  return {
    ip,
    userAgent: ua,
    browser,
    os,
    device,
  };
};
