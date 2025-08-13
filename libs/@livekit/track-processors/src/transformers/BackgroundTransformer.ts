import VideoTransformer from './VideoTransformer';
import { VideoTransformerInitOptions } from './types';
import * as vision from '@mediapipe/tasks-vision';

export type SegmenterOptions = Partial<
  vision.ImageSegmenterOptions['baseOptions']
>;

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
  assetPaths?: { tasksVisionFileSet?: string; modelAssetPath?: string };
  /** called when a new frame is processed */
  onFrameProcessed?: (stats: FrameProcessingStats) => void;
};

export default class BackgroundProcessor extends VideoTransformer<BackgroundOptions> {
  static get isSupported() {
    return (
      typeof OffscreenCanvas !== 'undefined' &&
      typeof VideoFrame !== 'undefined' &&
      typeof createImageBitmap !== 'undefined' &&
      !!document.createElement('canvas').getContext('webgl2')
    );
  }

  imageSegmenter?: vision.ImageSegmenter;

  segmentationResults: vision.ImageSegmenterResult | undefined;

  backgroundImage: ImageBitmap | null = null;

  options: BackgroundOptions;

  segmentationTimeMs: number = 0;

  constructor(opts: BackgroundOptions) {
    super();
    this.options = opts;
    this.update(opts);
  }

  async init({
    outputCanvas,
    inputElement: inputVideo,
  }: VideoTransformerInitOptions) {
    // Initialize WebGL with appropriate options based on our current state

    await super.init({ outputCanvas, inputElement: inputVideo });

    // Cross-platform asset discovery with Electron support
    let defaultWasmPath: string;
    let defaultModelPath: string;

    // Detect Electron environment
    const isElectron =
      typeof process !== 'undefined' &&
      process.versions &&
      process.versions.electron;

    // Detect file:// protocol (common in Electron)
    const isFileProtocol = window.location.protocol === 'file:';

    try {
      // Try to use import.meta.url if available (ES modules)
      const libraryUrl = new URL('../../', import.meta.url);

      if (isFileProtocol) {
        // For file:// protocol (Electron), convert to proper file URLs
        const basePath = libraryUrl.href;
        defaultWasmPath = new URL('wasm/', basePath).href;
        defaultModelPath = new URL('models/selfie_segmenter.tflite', basePath)
          .href;
      } else {
        // Regular web environment
        defaultWasmPath = new URL('wasm/', libraryUrl).href;
        defaultModelPath = new URL('models/selfie_segmenter.tflite', libraryUrl)
          .href;
      }
    } catch {
      // Fallback strategies based on environment
      if (isElectron || isFileProtocol) {
        // Electron/file:// fallback - use relative paths from current location
        const currentPath = window.location.href.replace(/\/[^/]*$/, '');
        defaultWasmPath = `${currentPath}/node_modules/@livekit/track-processors/wasm/`;
        defaultModelPath = `${currentPath}/node_modules/@livekit/track-processors/models/selfie_segmenter.tflite`;
      } else {
        // Browser fallback
        const baseUrl = window.location.origin;
        defaultWasmPath = `${baseUrl}/node_modules/@livekit/track-processors/wasm/`;
        defaultModelPath = `${baseUrl}/node_modules/@livekit/track-processors/models/selfie_segmenter.tflite`;
      }
    }

    const wasmPath =
      this.options.assetPaths?.tasksVisionFileSet ?? defaultWasmPath;
    const modelPath =
      this.options.assetPaths?.modelAssetPath ?? defaultModelPath;

    try {
      const fileSet = await vision.FilesetResolver.forVisionTasks(wasmPath);

      this.imageSegmenter = await vision.ImageSegmenter.createFromOptions(
        fileSet,
        {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
            ...this.options.segmenterOptions,
          },
          canvas: this.canvas,
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        }
      );
    } catch (error) {
      throw error;
    }

    // Skip loading the image here if update already loaded the image below
    if (this.options?.imagePath && !this.backgroundImage) {
      await this.loadBackground(this.options.imagePath).catch(err =>
        console.error('Error while loading processor background image: ', err)
      );
    }
    if (this.options.blurRadius) {
      this.gl?.setBlurRadius(this.options.blurRadius);
    }
  }

  async destroy() {
    await super.destroy();
    await this.imageSegmenter?.close();
    this.backgroundImage = null;
  }

  async loadBackground(path: string) {
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = err => reject(err);
      img.src = path;
    });
    const imageData = await createImageBitmap(img);
    this.gl?.setBackgroundImage(imageData);
  }

  async transform(
    frame: VideoFrame,
    controller: TransformStreamDefaultController<VideoFrame>
  ) {
    try {
      if (
        !(frame instanceof VideoFrame) ||
        frame.codedWidth === 0 ||
        frame.codedHeight === 0
      ) {
        console.debug('empty frame detected, ignoring');
        return;
      }

      if (this.isDisabled) {
        controller.enqueue(frame);
        return;
      }
      const frameTimeMs = Date.now();
      if (!this.canvas) {
        throw TypeError('Canvas needs to be initialized first');
      }
      this.canvas.width = frame.displayWidth;
      this.canvas.height = frame.displayHeight;
      const segmentationPromise = new Promise<void>((resolve, reject) => {
        try {
          let segmentationStartTimeMs = performance.now();
          this.imageSegmenter?.segmentForVideo(
            frame,
            segmentationStartTimeMs,
            result => {
              this.segmentationTimeMs =
                performance.now() - segmentationStartTimeMs;
              this.segmentationResults = result;
              this.updateMask(result.categoryMask);
              result.close();
              resolve();
            }
          );
        } catch (e) {
          reject(e);
        }
      });

      const filterStartTimeMs = performance.now();
      this.drawFrame(frame);
      if (this.canvas && this.canvas.width > 0 && this.canvas.height > 0) {
        const newFrame = new VideoFrame(this.canvas, {
          timestamp: frame.timestamp || frameTimeMs,
        });
        controller.enqueue(newFrame);
        const filterTimeMs = performance.now() - filterStartTimeMs;
        const stats: FrameProcessingStats = {
          processingTimeMs: this.segmentationTimeMs + filterTimeMs,
          segmentationTimeMs: this.segmentationTimeMs,
          filterTimeMs,
        };
        this.options.onFrameProcessed?.(stats);
      } else {
        controller.enqueue(frame);
      }
      await segmentationPromise;
    } catch (e) {
      console.error('Error while processing frame: ', e);
    } finally {
      frame.close();
    }
  }

  async update(opts: BackgroundOptions) {
    this.options = { ...this.options, ...opts };
    if (opts.blurRadius) {
      this.gl?.setBlurRadius(opts.blurRadius);
    } else if (opts.imagePath) {
      await this.loadBackground(opts.imagePath);
    }
  }

  private async drawFrame(frame: VideoFrame) {
    if (!this.gl) return;
    this.gl?.renderFrame(frame);
  }

  private async updateMask(mask: vision.MPMask | undefined) {
    if (!mask) return;
    this.gl?.updateMask(mask.getAsWebGLTexture());
  }
}
