export declare function createDownSampler(gl: WebGL2RenderingContext, width: number, height: number): {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    program: WebGLProgram;
    uniforms: any;
};
export declare function applyDownsampling(gl: WebGL2RenderingContext, inputTexture: WebGLTexture, downSampler: {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    program: WebGLProgram;
    uniforms: any;
}, vertexBuffer: WebGLBuffer, width: number, height: number): WebGLTexture;
//# sourceMappingURL=downSampler.d.ts.map