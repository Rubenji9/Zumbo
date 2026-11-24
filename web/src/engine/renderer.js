// Renderizador WebGL2 del mundo. Todo el relieve se calcula en el shader con
// coordenadas de precisión arbitraria: la CPU pasa, por octava, la parte entera
// y la fraccionaria de la cámara; la GPU solo suma un desplazamiento pequeño.
import { OCTAVES as NO, FREQ, LATTICE_OFFSET, WORLD_METERS as WM, hexToRgb } from '@zumbo/shared';
import fragSrc from './world.frag.glsl?raw';

const VERT = `#version 300 es
in vec2 p;void main(){gl_Position=vec4(p,0,1);}`;

const UNIFORMS = ['uRes', 'uScale', 'uZ', 'uMpp', 'uFade', 'uClouds', 'uOI', 'uOF', 'uOS', 'uFq', 'uNO', 'uSeed', 'uCam', 'uTgt', 'uTgtCell', 'uTgtOn',
  'uT1', 'uT2', 'uTR', 'uDecoyCrown', 'uLandTint', 'uWaterTint', 'uTownP', 'uCloudCover'];

export function createRenderer(canvas, world) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2');
  const compile = (type, src) => {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  for (const n of UNIFORMS) U[n] = gl.getUniformLocation(prog, n);

  // Uniforms fijos del día y del tema.
  const t = world.theme.target, w = world.theme.world;
  gl.uniform1fv(U.uFq, new Float32Array(FREQ));
  gl.uniform1ui(U.uSeed, world.seed);
  gl.uniform2i(U.uTgtCell, world.targetCell[0], world.targetCell[1]);
  gl.uniform3fv(U.uT1, hexToRgb(t.body)); gl.uniform3fv(U.uT2, hexToRgb(t.pupil)); gl.uniform3fv(U.uTR, hexToRgb(t.led));
  gl.uniform3fv(U.uDecoyCrown, hexToRgb(t.decoyPupil));
  gl.uniform3fv(U.uLandTint, w.landTint); gl.uniform3fv(U.uWaterTint, w.waterTint);
  gl.uniform1f(U.uTownP, w.townDensity); gl.uniform1f(U.uCloudCover, w.cloudCover);

  const OI = new Int32Array(NO * 2), OF = new Float32Array(NO * 2), OS = new Float32Array(NO);
  const T = world.target;

  /** Pinta la vista (x, y, z = px por unidad de mundo) en un área de w×h px CSS. */
  function render({ x, y, z }, w, h, scale, { clouds = 1, showTarget = true } = {}) {
    for (let i = 0; i < NO; i++) {
      const f = FREQ[i], qx = (x + LATTICE_OFFSET) * f, qy = (y + LATTICE_OFFSET) * f, ix = Math.floor(qx), iy = Math.floor(qy);
      OI[2 * i] = ix; OI[2 * i + 1] = iy; OF[2 * i] = qx - ix; OF[2 * i + 1] = qy - iy; OS[i] = f / z;
    }
    // Solo se evalúan las octavas mayores que ~0,8 píxeles.
    let n = 0;
    for (let i = 0; i < NO; i++) { if ((z * scale) / FREQ[i] > 0.8) n = i + 1; else break; }
    n = Math.max(7, Math.min(NO, n));
    const last = (z * scale) / FREQ[n - 1];
    const mpp = WM / z, rw = Math.round(w * scale), rh = Math.round(h * scale);
    gl.uniform2iv(U.uOI, OI); gl.uniform2fv(U.uOF, OF); gl.uniform1fv(U.uOS, OS);
    gl.uniform1i(U.uNO, n); gl.uniform1f(U.uFade, Math.min(1, Math.max(0, (last - 0.8) / 0.8)));
    gl.uniform2f(U.uRes, rw, rh); gl.uniform1f(U.uScale, scale); gl.uniform1f(U.uZ, z); gl.uniform1f(U.uMpp, mpp);
    gl.uniform1f(U.uClouds, clouds); gl.uniform2f(U.uCam, x, y);
    gl.uniform4f(U.uTgt, (T.x - x) * z, (T.y - y) * z, T.r / mpp, (T.alt * 0.8) / mpp);
    gl.uniform1f(U.uTgtOn, showTarget ? 1 : 0);
    gl.viewport(0, 0, rw, rh);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Pinta una vista fuera de pantalla y la devuelve como canvas 2D. */
  function snapshot(view, w, h, opts) {
    const fb = gl.createFramebuffer(), tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
    render(view, w, h, 1, opts);
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb); gl.deleteTexture(tx);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x2 = c.getContext('2d'), im = x2.createImageData(w, h);
    for (let r = 0; r < h; r++) im.data.set(px.subarray((h - 1 - r) * w * 4, (h - r) * w * 4), r * w * 4);
    x2.putImageData(im, 0, 0);
    return c;
  }

  return { render, snapshot, gl };
}
