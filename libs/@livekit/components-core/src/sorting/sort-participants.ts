import type { Participant } from "livekit-client";
import { LocalParticipant } from "livekit-client";
import {
  sortParticipantsByAudioLevel,
  sortParticipantsByIsSpeaking,
  sortParticipantsByJoinedAt,
  sortParticipantsByLastSpokenAT,
} from "./base-sort-functions";

// Track the last stable order and when it was last updated
let lastStableOrder: string[] = [];
let lastOrderUpdateTime = 0;
const POSITION_CHANGE_COOLDOWN = 3000; // 3 seconds in milliseconds

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
export function sortParticipants(participants: Participant[]): Participant[] {
  const currentTime = Date.now();
  const timeSinceLastUpdate = currentTime - lastOrderUpdateTime;

  // Create the ideal sort order
  const ideallySortedParticipants = [...participants];
  ideallySortedParticipants.sort((a, b) => {
    // loudest speaker first
    if (a.isSpeaking && b.isSpeaking) {
      return sortParticipantsByAudioLevel(a, b);
    }

    // speaker goes first
    if (a.isSpeaking !== b.isSpeaking) {
      return sortParticipantsByIsSpeaking(a, b);
    }

    // last active speaker first
    if (a.lastSpokeAt !== b.lastSpokeAt) {
      return sortParticipantsByLastSpokenAT(a, b);
    }

    // video on
    const aVideo = a.videoTrackPublications.size > 0;
    const bVideo = b.videoTrackPublications.size > 0;
    if (aVideo !== bVideo) {
      if (aVideo) {
        return -1;
      } else {
        return 1;
      }
    }

    // joinedAt
    return sortParticipantsByJoinedAt(a, b);
  });

  // Move local participant to front
  const localParticipant = ideallySortedParticipants.find(
    (p) => p.isLocal,
  ) as LocalParticipant;
  if (localParticipant) {
    const localIdx = ideallySortedParticipants.indexOf(localParticipant);
    if (localIdx >= 0) {
      ideallySortedParticipants.splice(localIdx, 1);
      if (ideallySortedParticipants.length > 0) {
        ideallySortedParticipants.splice(0, 0, localParticipant);
      } else {
        ideallySortedParticipants.push(localParticipant);
      }
    }
  }

  // Check if we should apply the new order or stick with the stable one
  const idealOrder = ideallySortedParticipants.map((p) => p.identity);
  const currentParticipantIds = new Set(participants.map((p) => p.identity));

  // If enough time has passed or this is the first sort, update the stable order
  if (
    timeSinceLastUpdate >= POSITION_CHANGE_COOLDOWN ||
    lastStableOrder.length === 0
  ) {
    lastStableOrder = idealOrder;
    lastOrderUpdateTime = currentTime;
    return ideallySortedParticipants;
  }

  // Otherwise, try to maintain the last stable order
  const stableParticipants: Participant[] = [];
  const participantMap = new Map(participants.map((p) => [p.identity, p]));

  // First, add participants in their last stable order (if they still exist)
  for (const participantId of lastStableOrder) {
    const participant = participantMap.get(participantId);
    if (participant && currentParticipantIds.has(participantId)) {
      stableParticipants.push(participant);
      participantMap.delete(participantId);
    }
  }

  // Then add any new participants that weren't in the last stable order
  for (const [, participant] of participantMap) {
    stableParticipants.push(participant);
  }

  // Ensure local participant is always first (this can change immediately)
  if (localParticipant) {
    const localIdx = stableParticipants.indexOf(localParticipant);
    if (localIdx > 0) {
      stableParticipants.splice(localIdx, 1);
      stableParticipants.splice(0, 0, localParticipant);
    }
  }

  return stableParticipants;
}
