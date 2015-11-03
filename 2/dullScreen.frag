#ifdef GL_ES
precision highp float;
#endif

varying vec2 uv;
uniform sampler2D old;

void main() {
   gl_FragColor = texture2D(old, uv) * 0.95;
}
