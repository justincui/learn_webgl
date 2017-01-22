/**
 * Created by justincui on 1/21/17.
 */
function main(){
    Promise.all(read_file('shader/vs/vertex.glsl', 'shader/fs/fragment.glsl'))
        .then((shaders_src)=>main_routine(shaders_src[0], shaders_src[1]));

}
function main_routine(VSHADER_SRC, FSHADER_SRC) {
    var canvas = document.getElementById('webgl');
    var gl = getWebGLContext(canvas);
    if(!gl){
        console.log('Failed to get rendering context for WebGL');
        return;
    }

    // console.log('vertex shader=\n',VSHADER_SRC);
    // console.log('fragment shader=\n', FSHADER_SRC);

    if(!initShaders(gl, VSHADER_SRC, FSHADER_SRC)){
        console.log('failed to initialize shaders');
        return;
    }

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position<0){
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if(a_Position<0){
        console.log("Failed to get the storage location of a_PointSize");
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.vertexAttrib1f(a_PointSize, 8.0);

    var g_points=[];
    canvas.onmousedown = (ev)=>{
        var x = ev.clientX;
        var y = ev.clientY;
        var rect = ev.target.getBoundingClientRect();
        x= ((x-rect.left) - canvas.width/2)/(canvas.width/2);
        y= ((canvas.height/2)-(y-rect.top))/(canvas.height/2);
        g_points.push(x);
        g_points.push(y);

        gl.clear(gl.COLOR_BUFFER_BIT);
        for(var i=0; i<g_points.length; i+=2){
            gl.vertexAttrib2f(a_Position, g_points[i], g_points[i+1]);
            gl.drawArrays(gl.POINTS,0,1);
        }
    };
}