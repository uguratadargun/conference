import { AccessToken } from "livekit-server-sdk";
import { LIVEKIT_CONFIG } from "../config/livekit";

export const generateToken = async (): Promise<{ url: string; token: string }> => {
  // Generate a more unique username to avoid duplicates
  const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string

  // Use crypto.getRandomValues if available for better randomness
  let randomPart: string;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    randomPart = array[0].toString(36);
  } else {
    randomPart = Math.floor(Math.random() * 999999).toString(36);
  }

  const username = `user_${timestamp}_${randomPart}`;

  console.log(`Generated unique username: ${username}`);

  const at = new AccessToken(
    LIVEKIT_CONFIG.apiKey,
    LIVEKIT_CONFIG.apiSecret,
    {
      identity: username,
    }
  );
  at.addGrant({ roomJoin: true, room: LIVEKIT_CONFIG.roomName });
  const token = await at.toJwt();
  const url = `wss://${LIVEKIT_CONFIG.projectName}.livekit.cloud`;

  return { url, token };
}; 