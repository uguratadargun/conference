export declare const boxBlurFragmentShader: any;
/**
 * Create the box blur shader program
 */
export declare function createBoxBlurProgram(gl: WebGL2RenderingContext): {
    program: WebGLProgram;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    uniforms: {
        position: number;
        texture: WebGLUniformLocation;
        texelSize: WebGLUniformLocation;
        direction: WebGLUniformLocation;
        radius: WebGLUniformLocation;
    };
};
//# sourceMappingURL=boxBlurShader.d.ts.map