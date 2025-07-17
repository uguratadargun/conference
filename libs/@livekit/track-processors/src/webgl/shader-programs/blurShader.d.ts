export declare const blurFragmentShader: any;
export declare function createBlurProgram(gl: WebGL2RenderingContext): {
    program: WebGLProgram;
    shader: WebGLShader;
    vertexShader: WebGLShader;
    uniforms: {
        position: number;
        texture: WebGLUniformLocation;
        texelSize: WebGLUniformLocation;
        direction: WebGLUniformLocation;
        radius: WebGLUniformLocation;
    };
};
export declare function applyBlur(gl: WebGL2RenderingContext, sourceTexture: WebGLTexture, width: number, height: number, blurRadius: number, blurProgram: WebGLProgram, blurUniforms: any, vertexBuffer: WebGLBuffer, processFramebuffers: WebGLFramebuffer[], processTextures: WebGLTexture[]): WebGLTexture;
//# sourceMappingURL=blurShader.d.ts.map