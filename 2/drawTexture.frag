#ifdef GL_ES
precision mediump float;
#endif

varying vec2 uv;
uniform sampler2D texture;

void main() {
   gl_FragColor = texture2D(texture, uv);
}
