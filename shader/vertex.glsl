#version 100 es

void main(){
    gl_Position = projectionMatrix * modelMatrix * vec4(position, 1.0)
    gl_PointSize = 20.;
}