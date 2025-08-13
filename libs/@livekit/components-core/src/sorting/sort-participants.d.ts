import type { Participant } from "livekit-client";
/**
 * Default sort for participants, it'll order participants by:
 * 1. local participant
 * 2. dominant speaker (speaker with the loudest audio level)
 * 3. other speakers that are recently active
 * 4. participants with video on
 * 5. by joinedAt
 *
 * Added stability: Positions won't change more frequently than every 3 seconds
 * to prevent jarring UI updates from rapid audio level changes.
 */
export declare function sortParticipants(participants: Participant[]): Participant[];
//# sourceMappingURL=sort-participants.d.ts.map