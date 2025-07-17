import type { TrackIdentifier } from '@livekit/components-core';
import * as React from 'react';
/** @public */
export interface UseMediaTrackOptions {
    element?: React.RefObject<HTMLMediaElement> | null;
    props?: React.HTMLAttributes<HTMLVideoElement | HTMLAudioElement>;
}
/**
 * @internal
 */
export declare function useMediaTrackBySourceOrName(observerOptions: TrackIdentifier, options?: UseMediaTrackOptions): {
    publication: import("livekit-client").TrackPublication;
    isMuted: boolean;
    isSubscribed: boolean;
    track: import("livekit-client").Track<import("livekit-client").Track.Kind>;
    elementProps: React.HTMLAttributes<HTMLElement>;
};
//# sourceMappingURL=useMediaTrackBySourceOrName.d.ts.map