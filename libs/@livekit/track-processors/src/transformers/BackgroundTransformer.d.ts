import * as vision from '@mediapipe/tasks-vision';
import VideoTransformer from './VideoTransformer';
import { VideoTransformerInitOptions } from './types';
export type SegmenterOptions = Partial<vision.ImageSegmenterOptions['baseOptions']>;
export interface FrameProcessingStats {
    processingTimeMs: number;
    segmentationTimeMs: number;
    filterTimeMs: number;
}
export type BackgroundOptions = {
    blurRadius?: number;
    imagePath?: string;
    /** cannot be updated through the `update` method, needs a restart */
    segmenterOptions?: SegmenterOptions;
    /** cannot be updated through the `update` method, needs a restart */
    assetPaths?: {
        tasksVisionFileSet?: string;
        modelAssetPath?: string;
    };
    /** called when a new frame is processed */
    onFrameProcessed?: (stats: FrameProcessingStats) => void;
};
export default class BackgroundProcessor extends VideoTransformer<BackgroundOptions> {
    static get isSupported(): boolean;
    imageSegmenter?: vision.ImageSegmenter;
    segmentationResults: vision.ImageSegmenterResult | undefined;
    backgroundImage: ImageBitmap | null;
    options: BackgroundOptions;
    segmentationTimeMs: number;
    constructor(opts: BackgroundOptions);
    init({ outputCanvas, inputElement: inputVideo, }: VideoTransformerInitOptions): Promise<void>;
    destroy(): Promise<void>;
    loadBackground(path: string): Promise<void>;
    transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>): Promise<void>;
    update(opts: BackgroundOptions): Promise<void>;
    private drawFrame;
    private updateMask;
}
//# sourceMappingURL=BackgroundTransformer.d.ts.map