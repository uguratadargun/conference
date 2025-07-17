import type { ProcessorOptions, Track, TrackProcessor } from 'livekit-client';
import { TrackTransformer } from './transformers';
export interface ProcessorWrapperOptions {
    /**
     * Maximum frame rate for fallback canvas.captureStream implementation
     * Default: 30
     */
    maxFps?: number;
}
export default class ProcessorWrapper<TransformerOptions extends Record<string, unknown>> implements TrackProcessor<Track.Kind> {
    /**
     * Determines if the Processor is supported on the current browser
     */
    static get isSupported(): boolean;
    /**
     * Determines if modern browser APIs are supported, which yield better performance
     */
    static get hasModernApiSupport(): boolean;
    name: string;
    source?: MediaStreamVideoTrack;
    processor?: MediaStreamTrackProcessor<VideoFrame>;
    trackGenerator?: MediaStreamTrackGenerator<VideoFrame>;
    canvas?: OffscreenCanvas | HTMLCanvasElement;
    displayCanvas?: HTMLCanvasElement;
    sourceDummy?: HTMLMediaElement;
    processedTrack?: MediaStreamTrack;
    transformer: TrackTransformer<TransformerOptions>;
    private useStreamFallback;
    private capturedStream?;
    private animationFrameId?;
    private renderContext?;
    private frameCallback?;
    private processingEnabled;
    private maxFps;
    constructor(transformer: TrackTransformer<TransformerOptions>, name: string, options?: ProcessorWrapperOptions);
    private setup;
    init(opts: ProcessorOptions<Track.Kind>): Promise<void>;
    private initStreamProcessorPath;
    private initFallbackPath;
    private startRenderLoop;
    restart(opts: ProcessorOptions<Track.Kind>): Promise<void>;
    restartTransformer(...options: Parameters<(typeof this.transformer)['restart']>): Promise<void>;
    updateTransformerOptions(...options: Parameters<(typeof this.transformer)['update']>): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=ProcessorWrapper.d.ts.map