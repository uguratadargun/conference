export declare const setupWebGL: (canvas: OffscreenCanvas | HTMLCanvasElement) => {
    renderFrame: (frame: VideoFrame) => void;
    updateMask: (mask: WebGLTexture) => void;
    setBackgroundImage: (image: ImageBitmap | null) => Promise<void>;
    setBlurRadius: (radius: number | null) => void;
    cleanup: () => void;
} | undefined;
//# sourceMappingURL=index.d.ts.map