/**
 * Created by justincui on 1/21/17.
 */
function main(){
    Promise.all(read_file('shader/vs/vertex.glsl', 'shader/fs/fragment.glsl'))
        .then((shaders_src)=>{
            console.log(shaders_src.join("\n__________________________________\n"));
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

    console.log(gl.getParameter(gl.VERSION));
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    console.log(gl.getParameter(gl.VENDOR));

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

    gl.uniform1f(u_PointSize, 18.0);
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

    let n= initVertexBuffer(gl, a_Position, [0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINE_STRIP,0,n);

    let start=0;
    canvas.onmousedown = (ev)=>{
        start+=1;
        start%=2;
        console.log("start=", start);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.LINE_STRIP,start,n-start);
    }

}

function initVertexBuffer(gl, attrib_pos, arr){
    let vertices = new Float32Array(arr);
    const n=Math.floor(arr.length/2);

    let vertexBuffer = gl.createBuffer();
    if(!vertexBuffer){
        console.log("Failed to create the buffer object");
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(attrib_pos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attrib_pos);
    return n;
}