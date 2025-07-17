import type { Participant } from 'livekit-client';
export declare function setupParticipantName(participant: Participant): {
    className: string;
    infoObserver: import("rxjs").Observable<{
        name: string;
        identity: string;
        metadata: string;
    } | {
        name: string;
        identity: string;
        metadata: string;
    }>;
};
//# sourceMappingURL=participantName.d.ts.map