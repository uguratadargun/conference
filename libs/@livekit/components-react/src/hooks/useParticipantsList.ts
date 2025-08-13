import { listParticipantsObserver } from "@livekit/components-core";
import type { RoomEvent, RemoteParticipant, Room } from "livekit-client";
import type { ParticipantInfo, ParticipantInfo_State } from "@livekit/protocol";
import * as React from "react";
import { useEnsureRoom } from "../context";

/** @public */
export interface UseParticipantsListOptions {
  /**
   * To optimize performance, you can use the `updateOnlyOn` property to decide on what RoomEvents the hook updates.
   * By default it updates on all relevant RoomEvents to keep the returned participants array up to date.
   * The minimal set of non-overwriteable `RoomEvents` is: `[RoomEvent.ParticipantConnected, RoomEvent.ParticipantDisconnected, RoomEvent.ConnectionStateChanged]`
   */
  updateOnlyOn?: RoomEvent[];
  /**
   * The room to use. If not provided, the hook will use the room from the context.
   */
  room?: Room;
}

/**
 * The `useRemoteParticipants` hook returns all remote participants (without the local) of the current room.
 * @remarks
 * To optimize performance, you can use the `updateOnlyOn` property to decide on what `RoomEvents` the hook updates.
 *
 * @example
 * ```tsx
 * const participants = useRemoteParticipants();
 * <ParticipantLoop participants={participants}>
 *  <ParticipantName />
 * </ParticipantLoop>
 * ```
 * @public
 */
export function useParticipantsList(options: UseParticipantsListOptions = {}) {
  const room = useEnsureRoom(options.room);
  const [participants, setParticipants] = React.useState<{
    ringingParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    deniedParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    busyParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    leftParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    activeParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    noAnswerParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    notReachableParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    all: Map<
      string,
      {
        participant: RemoteParticipant | ParticipantInfo;
        state: ParticipantInfo_State;
      }
    >;
  }>({
    ringingParticipants: new Map(room.participantsList.ringingParticipants),
    deniedParticipants: new Map(room.participantsList.deniedParticipants),
    busyParticipants: new Map(room.participantsList.busyParticipants),
    leftParticipants: new Map(room.participantsList.leftParticipants),
    activeParticipants: new Map(room.participantsList.activeParticipants),
    noAnswerParticipants: new Map(room.participantsList.noAnswerParticipants),
    notReachableParticipants: new Map(
      room.participantsList.notReachableParticipants,
    ),
    all: new Map(room.participantsList.all),
  });

  React.useEffect(() => {
    const listener = listParticipantsObserver(room, {
      additionalRoomEvents: options.updateOnlyOn,
    }).subscribe((newParticipants) => {
      // Create new Map instances to ensure React detects the changes
      setParticipants({
        ringingParticipants: new Map(newParticipants.ringingParticipants),
        deniedParticipants: new Map(newParticipants.deniedParticipants),
        busyParticipants: new Map(newParticipants.busyParticipants),
        leftParticipants: new Map(newParticipants.leftParticipants),
        activeParticipants: new Map(newParticipants.activeParticipants),
        noAnswerParticipants: new Map(newParticipants.noAnswerParticipants),
        notReachableParticipants: new Map(
          newParticipants.notReachableParticipants,
        ),
        all: new Map(newParticipants.all),
      });
    });
    return () => listener.unsubscribe();
  }, [room, JSON.stringify(options.updateOnlyOn)]);
  return participants;
}
