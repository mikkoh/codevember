var glslify = require('glslify');
var glNow = require('gl-now');
var glShader = require('gl-shader');
var glVao = require('gl-vao');
var glBuffer = require('gl-buffer');
var glMat4 = require('gl-mat4');
var pack = require('array-pack-2d');
var glFBO = require('gl-fbo');
var aBigTriangle = require('a-big-triangle');
var glTexture2d = require('gl-texture2d');

document.body.style.background = '#000';

var NUM_SEGMENTS = 1000;

var snake = Array.apply(undefined, Array(NUM_SEGMENTS)).map(function(v, i, arr) {
  // return [ 0, i / arr.length * 1000, i / arr.length * 1000 ];
  return [0, 0, 0];
});

var snakeIndices = Array.apply(undefined, Array(NUM_SEGMENTS - 1)).map(function(v, i, arr) {
  return [ i, i + 1 ];
});

var projection = glMat4.create();
var view = glMat4.create();
var model = glMat4.create();
var combined = glMat4.create();
var shell;
var fbo1;
var fbo2;
var inverseCombined;
var shaderLine;
var shaderScreen;
var shaderDull;
var shaderTexture;
var snakeGeo;
var texture;
var image;

image = new Image();
image.src = 'texture.jpg';
image.onload = function() {

  shell = glNow();

  shell.on('gl-init', function() {
    var gl = shell.gl;
    var combined;

    glMat4.perspective(projection, Math.PI * 0.25, shell.width / shell.height, 0.1, 10000);
    glMat4.translate(view, view, [ 0, 0, -1000]);

    combined = glMat4.multiply(glMat4.create(), projection, view);
    inverseCombined = glMat4.invert(glMat4.create(), combined);

    shaderLine = glShader(gl, 
      glslify(__dirname + '/line.vert'),
      glslify(__dirname + '/line.frag')
    );

    shaderScreen = glShader(gl,
      glslify(__dirname + '/screen.vert'),
      glslify(__dirname + '/screen.frag')
    );

    shaderDull = glShader(gl,
      glslify(__dirname + '/screen.vert'),
      glslify(__dirname + '/dullScreen.frag')
    );

    shaderTexture = glShader(gl,
      glslify(__dirname + '/screen.vert'),
      glslify(__dirname + '/drawTexture.frag')
    );

    texture = glTexture2d(gl, image);

    fbo1 = glFBO(gl, [ shell.width, shell.height ]);
    fbo2 = glFBO(gl, [ shell.width, shell.height ]);

    snakeGeo = glVao(
      gl, 
      [
        {
          buffer: glBuffer(gl, pack(snake, 'float32')),
          type: gl.FLOAT,
          size: 3
        }
      ],
      glBuffer(gl, pack(snakeIndices, 'uint16'), gl.ELEMENT_ARRAY_BUFFER)
    );
  });

  shell.on('gl-render', function(dt) {
    var gl = shell.gl;

    // update the head 
    snake[ 0 ] = getMouseVector();

    for(var i = 1; i < snake.length; i++) {
      snake[ i ] = snake[ i ].map(function(value, j) {
        return (snake[ i - 1 ][ j ] - value) * 0.4 + value + Math.random() * 10 - 5;
      });
    }

    snakeGeo.update(
      [
        {
          buffer: glBuffer(gl, pack(snake, 'float32')),
          type: gl.FLOAT,
          size: 3
        }
      ],
      glBuffer(gl, pack(snakeIndices, 'uint16'), gl.ELEMENT_ARRAY_BUFFER)
    );

    
    fbo1.bind();

    // draw the old ghosted
    shaderDull.bind();
    shaderDull.uniforms.old = fbo2.color[0].bind(0);
    aBigTriangle(gl);

    // now draw the new line
    shaderLine.bind();
    shaderLine.uniforms.projection = projection;
    shaderLine.uniforms.view = view;
    shaderLine.uniforms.model = model;

    snakeGeo.bind();
    snakeGeo.draw(gl.LINES, snake.length);
    snakeGeo.unbind();


    // draw both masked by the flower image
    fbo2.bind();
    shaderScreen.bind();
    shaderScreen.uniforms.flowerImage = texture.bind(0);
    shaderScreen.uniforms.mask = fbo1.color[0].bind(1);
    aBigTriangle(gl);

    // now render the current to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    shaderTexture.bind();
    shaderTexture.uniforms.texture = fbo2.color[ 0 ].bind(0);
    
    aBigTriangle(gl);
  });

  function getMouseVector() {
    var out = [0, 0, 0];
    var mousePoint = [
      shell.mouse[ 0 ] - window.innerWidth * 0.5,
      -(shell.mouse[ 1 ] - window.innerHeight * 0.5),
      0
    ];

    return mousePoint;
  }
};