#version 100
attribute vec4 a_Position;
uniform float u_PointSize;

void main(){
    gl_Position = a_Position; //coordinats
    gl_PointSize = u_PointSize; //set the point size
}