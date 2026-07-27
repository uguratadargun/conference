import { hashKey, hexToKey } from './e2ee';

type LivekitConfig = {
  url: string;
};

let configPromise: Promise<LivekitConfig> | null = null;

/**
 * LiveKit config'i döndürür. Build'e gömülmez; dist/config.json'dan
 * runtime'da okunur, böylece deploy sonrası düzenlenebilir.
 * @returns Promise<LivekitConfig>
 */
export const getLivekitConfig = (): Promise<LivekitConfig> => {
  configPromise ??= fetch('./config.json', { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error(`config.json okunamadı: ${r.status}`);
    return r.json() as Promise<LivekitConfig>;
  });
  return configPromise;
};

/**
 * Token'ı sunucudan alır
 * @param username Kullanıcı adı
 * @param roomName Oda adı
 * @returns Promise<{url: string, token: string, roomId: string, identity: string}>
 */
export const getTokenFromServer = async (
  username: string | undefined,
  roomName: string,
  password?: string
): Promise<{
  url: string;
  token: string;
  roomId: string;
}> => {
  try {
    const livekitConfig = await getLivekitConfig();
    // LiveKit URL'inden HTTP API URL'i türet
    const livekitUrl = livekitConfig.url.replace(/^wss?:\/\//, '');
    const serverUrl = `https://${livekitUrl}`;

    const endpoint = `${serverUrl}/twirp/livekit.RoomService/CreateRoomToken`;
    const hashPassword = await hashKey(hexToKey(password || ''));
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username || 'guest',
        roomId: roomName,
        password: hashPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get token from server: ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      url: livekitConfig.url,
      token: data.token,
      roomId: data.roomId || roomName,
    };
  } catch (error) {
    console.error('Error getting token from server:', error);
    throw error;
  }
};

