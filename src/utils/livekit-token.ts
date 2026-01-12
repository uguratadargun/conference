type LivekitConfig = {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  url: string;
};

import { AccessToken } from 'livekit-server-sdk';
import livekitConfig from '../livekit-config.json';
import { hashKey, hexToKey } from './e2ee';

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
    const serverUrl = `http://${livekitUrl}`;

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

/**
 * Client-side token oluşturur (fallback için)
 * @deprecated Sunucudan token almak için getTokenFromServer kullanın
 */
export const generateToken = async (
  username?: string,
  roomName?: string
): Promise<{
  url: string;
  token: string;
  roomId: string;
  identity: string;
}> => {
  const livekitConfig = await getLivekitConfig();

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const identity = username
    ? `${username}_${randomPart}`
    : `ugur_${randomPart}.2`;
  const displayName = username || 'Ugur Ata Dargun';
  const room = roomName || livekitConfig.roomName;

  const at = new AccessToken(livekitConfig.apiKey, livekitConfig.apiSecret, {
    identity,
    name: displayName,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  const url = livekitConfig.url;

  return { url, token, roomId: room, identity };
};
