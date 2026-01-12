/**
 * E2EE key üretme ve hash'leme utility fonksiyonları
 */

import { getLivekitConfig } from './livekit-token';

/**
 * E2EE için rastgele bir key üretir (32 byte = 256 bit)
 * @returns Uint8Array olarak key
 */
export async function generateE2EEKey(): Promise<Uint8Array> {
  const key = new Uint8Array(32); // 32 byte = 256 bit
  crypto.getRandomValues(key);
  return key;
}

/**
 * Key'i hex string'e çevirir
 * @param key Uint8Array key
 * @returns Hex string
 */
export function keyToHex(key: Uint8Array): string {
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Key'i SHA256 ile hash'ler
 * @param key Uint8Array key
 * @returns Hex string olarak hash
 */
export async function hashKey(key: Uint8Array): Promise<string> {
  // Uint8Array'i ArrayBuffer'a kopyala (BufferSource uyumluluğu için)
  const keyBuffer = key.slice().buffer;
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return keyToHex(hashArray);
}

/**
 * E2EE key hash'ini sunucuya gönderir
 * @param keyHash SHA256 hash'lenmiş key (hex string)
 * @param roomName Oda adı
 * @param identity Kullanıcı identity
 * @returns Promise<boolean> Başarılı olup olmadığı
 */
export async function sendE2EEKeyHashToServer(
  keyHash: string,
  roomName: string,
  token: string
): Promise<boolean> {
  try {
    // livekitConfig'den API URL'ini al
    const { getLivekitConfig } = await import('./livekit-token');
    const livekitConfig = await getLivekitConfig();

    // LiveKit URL'inden HTTP API URL'i türet
    // Eğer ws:// veya wss:// ile başlıyorsa kaldır, yoksa direkt kullan
    const livekitUrl = livekitConfig.url.replace(/^wss?:\/\//, '');
    // HTTP protokolü ekle (varsayılan olarak http kullan)
    const serverUrl = `https://${livekitUrl}`;

    const endpoint = `${serverUrl}/twirp/livekit.RoomService/SetRoomPassword`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        room_id: roomName,
        password: keyHash,
      }),
    });

    if (!response.ok) {
      console.error(
        'Failed to send E2EE key hash to server:',
        response.statusText
      );
      return false;
    }

    console.log('E2EE key hash successfully sent to server');
    return true;
  } catch (error) {
    console.error('Error sending E2EE key hash to server:', error);
    return false;
  }
}

/**
 * Hex string'i Uint8Array'e çevirir
 * @param hex Hex string
 * @returns Uint8Array
 */
export function hexToKey(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

/**
 * E2EE key üretir, hash'ler ve sunucuya gönderir
 * @param roomName Oda adı
 * @param identity Kullanıcı identity
 * @returns Promise<{ rawKey: string; keyHash: string } | null> Üretilen raw key ve hash veya null
 */
export async function generateAndSendE2EEKey(
  roomName: string,
  token: string
): Promise<{ rawKey: string; keyHash: string } | null> {
  try {
    // Key üret
    const key = await generateE2EEKey();
    const rawKey = keyToHex(key);

    // Key'i hash'le
    const keyHash = await hashKey(key);

    // Sunucuya gönder
    const success = await sendE2EEKeyHashToServer(keyHash, roomName, token);

    if (success) {
      return { rawKey, keyHash };
    }

    return null;
  } catch (error) {
    console.error('Error generating and sending E2EE key:', error);
    return null;
  }
}
