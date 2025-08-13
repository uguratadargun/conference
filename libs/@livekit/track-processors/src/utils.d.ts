export declare const supportsOffscreenCanvas: () => boolean;
export declare function waitForTrackResolution(track: MediaStreamTrack): Promise<{
    width: number;
    height: number;
} | {
    width: undefined;
    height: undefined;
}>;
export declare function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas;
//# sourceMappingURL=utils.d.ts.map