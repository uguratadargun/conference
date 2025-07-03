import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_CONFIG = {
  apiKey: 'APIB6KUGSRtzEGw',
  apiSecret: 'bxKAKulJVpsHE0h2ehVGpRKp9zKBBRMOiFvfwZQz63K',
  projectName: 'ugurdargun-w5ph6ze0',
  roomName: 'test61',
} as const;

export const generateToken = async (): Promise<{
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
  const username = `ugur_${randomPart}`;

  console.log(`Generated unique username: ${username}`);

  const at = new AccessToken(LIVEKIT_CONFIG.apiKey, LIVEKIT_CONFIG.apiSecret, {
    identity: username,
  });
  at.addGrant({
    roomJoin: true,
    room: LIVEKIT_CONFIG.roomName,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
  });
  const token = await at.toJwt();
  const url = `10.0.2.148:7880`;

  return { url, token, roomId: LIVEKIT_CONFIG.roomName, identity: username };
};
