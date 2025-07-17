export declare const compositeFragmentShader: any;
/**
 * Create the composite shader program
 */
export declare function createCompositeProgram(gl: WebGL2RenderingContext): {
    program: WebGLProgram;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    attribLocations: {
        position: number;
    };
    uniformLocations: {
        mask: WebGLUniformLocation;
        frame: WebGLUniformLocation;
        background: WebGLUniformLocation;
        stepWidth: WebGLUniformLocation;
    };
};
//# sourceMappingURL=compositeShader.d.ts.map