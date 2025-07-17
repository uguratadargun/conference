/**
 * Initialize a WebGL texture
 */
export declare function initTexture(gl: WebGL2RenderingContext, texIndex: number): WebGLTexture;
export declare function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader;
export declare function createProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram;
/**
 * Create a WebGL framebuffer with the given texture as color attachment
 */
export declare function createFramebuffer(gl: WebGL2RenderingContext, texture: WebGLTexture, width: number, height: number): WebGLFramebuffer;
/**
 * Create a vertex buffer for a full-screen quad
 */
export declare function createVertexBuffer(gl: WebGL2RenderingContext): WebGLBuffer | null;
/**
 * Resizes and crops an image to cover a target canvas while maintaining aspect ratio
 * @param image The source image
 * @param targetWidth The target width
 * @param targetHeight The target height
 * @returns A cropped and resized ImageBitmap
 */
export declare function resizeImageToCover(image: ImageBitmap, targetWidth: number, targetHeight: number): Promise<ImageBitmap>;
declare function getEmptyImageData(): ImageData;
declare const glsl: (source: any) => any;
export { getEmptyImageData, glsl };
//# sourceMappingURL=utils.d.ts.map