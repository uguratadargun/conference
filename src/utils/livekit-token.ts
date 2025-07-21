import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_CONFIG = {
  apiKey: 'devkey',
  apiSecret: 'secret',
  projectName: 'ugurdargun-w5ph6ze0',
  roomName: 'test63',
} as const;

export const generateToken = async (
  username?: string,
  roomName?: string
): Promise<{
  url: string;
  token: string;
  roomId: string;
  identity: string;
}> => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from(
    { length: 3 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  const identity = username
    ? `${username}_${randomPart}`
    : `ugur_${randomPart}.2`;
  const displayName = username || 'Ugur Ata Dargun';
  const room = roomName || LIVEKIT_CONFIG.roomName;

  const at = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
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
  const url = `10.0.2.154:7880`;

  return { url, token, roomId: room, identity };
};
