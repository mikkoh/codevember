#ifdef GL_ES
precision mediump float;
#endif

varying vec2 uv;
uniform sampler2D mask;
uniform sampler2D flowerImage;

void main() {
   gl_FragColor = texture2D(flowerImage, uv) * texture2D(mask, uv).a;
}
