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

    const verticesTexCoords = new Float32Array([
        //vertices coordinates     texture coordinates
        -0.8, 0.8,                  0.5, 0.5,
        -0.8, -0.8,                 0.5, 0.0,
        0.8, 0.8,                   1.0, 0.5,
        0.8,-0.8,                   1.0, 0.0,
    ]);
    let n= initVertexBuffer(gl, verticesTexCoords);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    loadTextureAndDraw(gl, n);
}

function initVertexBuffer(gl, verticesTexCoords){
    const n=Math.floor(verticesTexCoords.length/4);

    let vertexTexCoordBuffer = gl.createBuffer();
    if(!vertexTexCoordBuffer){
        console.log("Failed to create the buffer object");
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    const FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;

    const a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position<0){
        console.log("Failed to get the storage location of a_Position");
        return;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);

    const a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if(a_TexCoord<0){
        console.log("Failed to get the storage location of a_TexCoord");
        return;
    }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}

function loadImage(gl, image){
    let texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    let u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if(!u_Sampler){
        console.log("Failed to get the storage location of u_Sampler");
    }
    gl.uniform1i(u_Sampler, 0);
}

function loadTextureAndDraw(gl, n){
    let image = new Image();
    image.onload = ()=>{
        loadImage(gl, image);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    };
    image.src='../res/sky.jpg';
}