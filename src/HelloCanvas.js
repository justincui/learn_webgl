/**
 * Created by justincui on 1/21/17.
 */
function main(){
    Promise.all(read_file('shader/vs/vertex.glsl', 'shader/fs/fragment.glsl'))
        .then((shaders_src)=>{
            console.log("src=", ...shaders_src);
            main_routine(shaders_src[0], shaders_src[1]);
        });

}
function main_routine(VSHADER_SRC, FSHADER_SRC) {
    let canvas = document.getElementById('webgl');
    let gl = getWebGLContext(canvas);
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

    let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    console.log("a_Position", a_Position);
    if(a_Position<0){
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    let u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
    console.log('u_PointSize=', u_PointSize);
    if(!u_PointSize){
        console.log("Failed to get the storage location of u_PointSize");
        return;
    }

    let u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    console.log('u_FragColor', u_FragColor);
    if(!u_FragColor){
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(u_PointSize, 18.0);

    let g_points=[];
    let g_colors=[];
    canvas.onmousedown = (ev)=>{
        let x = ev.clientX;
        let y = ev.clientY;
        let rect = ev.target.getBoundingClientRect();
        x= ((x-rect.left) - canvas.width/2)/(canvas.width/2);
        y= ((canvas.height/2)-(y-rect.top))/(canvas.height/2);
        g_points.push([x,y]);
        g_colors.push([x>=0?1:0, y>=0?1:0,1,1]);

        gl.clear(gl.COLOR_BUFFER_BIT);
        for(let i=0; i<g_points.length; i+=1){
            gl.vertexAttrib2fv(a_Position, g_points[i]);
            gl.uniform4fv(u_FragColor, g_colors[i]);
            gl.drawArrays(gl.POINTS,0,1);
        }
    };
}
