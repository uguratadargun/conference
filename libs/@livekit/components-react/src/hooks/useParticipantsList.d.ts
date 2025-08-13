import type { RoomEvent, RemoteParticipant, Room } from "livekit-client";
import type { ParticipantInfo, ParticipantInfo_State } from "@livekit/protocol";
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
export declare function useParticipantsList(options?: UseParticipantsListOptions): {
    ringingParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    deniedParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    busyParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    leftParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    activeParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    noAnswerParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    notReachableParticipants: Map<string, RemoteParticipant | ParticipantInfo>;
    all: Map<string, {
        participant: RemoteParticipant | ParticipantInfo;
        state: ParticipantInfo_State;
    }>;
};
//# sourceMappingURL=useParticipantsList.d.ts.map