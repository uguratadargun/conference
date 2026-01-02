type LivekitConfig = {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  url: string;
};

export async function getLivekitConfig(): Promise<LivekitConfig> {
  const res = await fetch('./livekit-config.json');
  if (!res.ok) throw new Error('Config not found');
  return res.json();
}

import { AccessToken } from 'livekit-server-sdk';

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
