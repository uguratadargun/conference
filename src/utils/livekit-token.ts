import livekitConfig from '../livekit-config.json';
import { hashKey, hexToKey } from './e2ee';

type LivekitConfig = {
  roomName: string;
  url: string;
};

/**
 * LiveKit config'i döndürür
 * @returns LivekitConfig
 */
export const getLivekitConfig = (): LivekitConfig => {
  return livekitConfig as LivekitConfig;
};

/**
 * Token'ı sunucudan alır
 * @param username Kullanıcı adı
 * @param roomName Oda adı
 * @returns Promise<{url: string, token: string, roomId: string, identity: string}>
 */
export const getTokenFromServer = async (
  username?: string,
  roomName?: string,
  password?: string
): Promise<{
  url: string;
  token: string;
  roomId: string;
}> => {
  try {
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
        roomId: roomName || livekitConfig.roomName,
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
      roomId: data.roomId || roomName || livekitConfig.roomName,
    };
  } catch (error) {
    console.error('Error getting token from server:', error);
    throw error;
  }
};

