// generate-token.js
import { AccessToken } from "livekit-server-sdk";

const apiKey = "APItrVwR79fsfN6"; // <-- Replace with your API Key
const apiSecret = "0sbQLRiGbRSTBpAlKUJO7hdniYfGCCfANlv5rUMK8ib"; // <-- Replace with your API Secret
const room = "test-room"; // Room name
const identity = "user1"; // User identity (can be any string)

const at = new AccessToken(apiKey, apiSecret, { identity });
at.addGrant({ roomJoin: true, room });

console.log(await at.toJwt());
