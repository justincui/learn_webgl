/**
 * Created by justincui on 1/21/17.
 */
function main() {
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if(!gl){
        console.log('Failed to get rendering context for WebGL');
        return;
    }
    const [VSHADER_SRC, FSHADER_SRC] = read_file(['shader/vs/vertex.c', 'shader/fs/fragment.c']);
    console.log('vertex shader=\n',VSHADER_SRC);
    console.log('fragment shader=\n', FSHADER_SRC);

    if(!initShaders(gl, VSHADER_SRC, FSHADER_SRC)){
        console.log('failed to initialize shaders');
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS,0,10);

}