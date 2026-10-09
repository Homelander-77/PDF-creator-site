import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { RenderError } from './errors.js';

function deny(): never {
  throw new RenderError('url_not_allowed');
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }
  const [a,b] = parts;
  return (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254));
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (normalized === '::1' || normalized === '::');
}

function isPrivateIP(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    return isPrivateIPv6(ip);
  }
  return true;
}

export async function assertHttpUrlAllowed(rawUrl: string): Promise<void> {
    let url: URL;

    try {
        url = new URL(rawUrl);
    } catch {
        deny();
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        deny();
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (isIP(hostname)) {
      if (isPrivateIP(hostname)) {
          deny();
      }
      return;
    }
    let addresses;
    try {
      addresses = await lookup(hostname, {all: true, verbatim: true,});
    } catch {
      deny();
    }
    if (addresses.length === 0) {
      deny();
    }
    for (const { address } of addresses) {
      if (isPrivateIP(address)) {
        deny();
      }
    }
}
