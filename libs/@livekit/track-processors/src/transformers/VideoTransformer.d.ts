import { setupWebGL } from '../webgl/index';
import { VideoTrackTransformer, VideoTransformerInitOptions } from './types';
export default abstract class VideoTransformer<Options extends Record<string, unknown>> implements VideoTrackTransformer<Options> {
    transformer?: TransformStream;
    canvas?: OffscreenCanvas | HTMLCanvasElement;
    inputVideo?: HTMLVideoElement;
    gl?: ReturnType<typeof setupWebGL>;
    protected isDisabled?: Boolean;
    init({ outputCanvas, inputElement: inputVideo, }: VideoTransformerInitOptions): Promise<void>;
    restart({ outputCanvas, inputElement: inputVideo }: VideoTransformerInitOptions): Promise<void>;
    destroy(): Promise<void>;
    abstract transform(frame: VideoFrame, controller: TransformStreamDefaultController<VideoFrame>): void;
    abstract update(options: Options): void;
}
//# sourceMappingURL=VideoTransformer.d.ts.map