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
        texture: WebGLUniformLocation | null;
        texelSize: WebGLUniformLocation | null;
        direction: WebGLUniformLocation | null;
        radius: WebGLUniformLocation | null;
    };
};
//# sourceMappingURL=boxBlurShader.d.ts.map