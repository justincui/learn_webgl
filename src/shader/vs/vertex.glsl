#version 100
attribute vec4 a_Position;
attribute vec2 a_TexCoord;
varying vec2 v_TexCoord;
void main(){
    gl_Position = a_Position; //coordinats
    v_TexCoord = a_TexCoord;
}
