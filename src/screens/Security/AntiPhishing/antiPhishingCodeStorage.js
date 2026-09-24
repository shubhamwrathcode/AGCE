import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'agce_anti_phishing_code_';

const userKey = (userId) => `${KEY_PREFIX}${userId || 'default'}`;

export function pickAntiPhishingCode(data) {
  if (!data || typeof data !== 'object') return '';
  const candidates = [
    data.antiPhishingCode,
    data.anti_phishing_code,
    data.code,
    data.phishingCode,
    data.phishing_code,
  ];
  for (const c of candidates) {
    const s = c == null ? '' : String(c).trim();
    if (s && s !== 'null' && s !== 'undefined') return s;
  }
  return '';
}

/** Display like "1 2 3 4 5 6" for the gold card */
export function formatAntiPhishingCodeDisplay(code) {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!clean) return '';
  return clean.split('').join(' ');
}

export async function saveAntiPhishingCodeLocal(userId, code) {
  const clean = String(code || '').replace(/\s+/g, '').trim();
  if (!clean) return;
  try {
    await AsyncStorage.setItem(userKey(userId), clean);
  } catch {
    /* ignore */
  }
}

export async function getAntiPhishingCodeLocal(userId) {
  try {
    const v = await AsyncStorage.getItem(userKey(userId));
    return v ? String(v).trim() : '';
  } catch {
    return '';
  }
}

export async function clearAntiPhishingCodeLocal(userId) {
  try {
    await AsyncStorage.removeItem(userKey(userId));
  } catch {
    /* ignore */
  }
}
