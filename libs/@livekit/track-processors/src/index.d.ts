import ProcessorWrapper, { ProcessorWrapperOptions } from './ProcessorWrapper';
import BackgroundTransformer, { BackgroundOptions, FrameProcessingStats, SegmenterOptions } from './transformers/BackgroundTransformer';
export * from './transformers/types';
export { default as VideoTransformer } from './transformers/VideoTransformer';
export { ProcessorWrapper, type BackgroundOptions, type SegmenterOptions, BackgroundTransformer, type ProcessorWrapperOptions, };
/**
 * Determines if the current browser supports background processors
 */
export declare const supportsBackgroundProcessors: () => boolean;
/**
 * Determines if the current browser supports modern background processors, which yield better performance
 */
export declare const supportsModernBackgroundProcessors: () => boolean;
export interface BackgroundProcessorOptions extends ProcessorWrapperOptions {
    blurRadius?: number;
    imagePath?: string;
    segmenterOptions?: SegmenterOptions;
    assetPaths?: {
        tasksVisionFileSet?: string;
        modelAssetPath?: string;
    };
    onFrameProcessed?: (stats: FrameProcessingStats) => void;
}
export declare const BackgroundBlur: (blurRadius?: number, segmenterOptions?: SegmenterOptions, onFrameProcessed?: (stats: FrameProcessingStats) => void, processorOptions?: ProcessorWrapperOptions) => ProcessorWrapper<BackgroundOptions>;
export declare const VirtualBackground: (imagePath: string, segmenterOptions?: SegmenterOptions, onFrameProcessed?: (stats: FrameProcessingStats) => void, processorOptions?: ProcessorWrapperOptions) => ProcessorWrapper<BackgroundOptions>;
export declare const BackgroundProcessor: (options: BackgroundProcessorOptions, name?: string) => ProcessorWrapper<BackgroundOptions>;
//# sourceMappingURL=index.d.ts.map