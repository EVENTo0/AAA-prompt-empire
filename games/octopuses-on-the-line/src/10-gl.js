/* =====================================================================
 * OCTOPUSES ON THE LINE — 10-gl.js
 * A small purpose-built WebGL2 forward renderer.
 *
 *   - single texture atlas, so the whole city draws with one bound texture
 *   - two-cascade directional shadow maps with hardware PCF
 *   - hemisphere ambient + sun + up to 16 point lights (lanterns, neon)
 *   - height/aerial fog, procedural sky dome, animated water
 *   - HDR buffer, bloom, ACES tonemap, vignette, grain, FXAA
 *
 * No external dependencies, no asset files.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var M4 = OCTO.M4, V3 = OCTO.V3, clamp = OCTO.util.clamp;

  var MAX_LIGHTS = 16;
  var ATLAS_CELLS = 4; // 4x4 grid

  /* --------------------------------------------------------------- shaders */

  var SCENE_VS = [
    '#version 300 es',
    'precision highp float;',
    'layout(location=0) in vec3 aPos;',
    'layout(location=1) in vec3 aNrm;',
    'layout(location=2) in vec2 aUV;',
    'layout(location=3) in float aCell;',
    'layout(location=4) in vec3 aCol;',
    'layout(location=5) in vec2 aMat;',
    'uniform mat4 uViewProj;',
    'uniform mat4 uModel;',
    'uniform mat3 uNormalMat;',
    'uniform float uTime;',
    'uniform float uWind;',
    'out vec3 vWorld; out vec3 vNrm; out vec2 vUV; out float vCell;',
    'out vec3 vCol; out vec2 vMat; out float vDepth;',
    'void main(){',
    '  vec3 p = aPos;',
    '  if (uWind > 0.0) {',
    '    float h = max(aPos.y, 0.0);',
    '    float s = sin(uTime * 1.6 + aPos.x * 0.7 + aPos.z * 0.5);',
    '    float c = cos(uTime * 1.15 + aPos.z * 0.6 - aPos.x * 0.3);',
    '    p.x += s * uWind * h; p.z += c * uWind * h * 0.8;',
    '  }',
    '  vec4 wp = uModel * vec4(p, 1.0);',
    '  vWorld = wp.xyz;',
    '  vNrm = normalize(uNormalMat * aNrm);',
    '  vUV = aUV; vCell = aCell; vCol = aCol; vMat = aMat;',
    '  gl_Position = uViewProj * wp;',
    '  vDepth = gl_Position.w;',
    '}'
  ].join('\n');

  var SCENE_FS = [
    '#version 300 es',
    'precision highp float;',
    'precision highp sampler2DShadow;',
    '#define MAXL 16',
    'in vec3 vWorld; in vec3 vNrm; in vec2 vUV; in float vCell;',
    'in vec3 vCol; in vec2 vMat; in float vDepth;',
    'out vec4 outColor;',
    'uniform sampler2D uAtlas;',
    'uniform sampler2DShadow uShadow0;',
    'uniform sampler2DShadow uShadow1;',
    'uniform mat4 uLightVP0; uniform mat4 uLightVP1;',
    'uniform float uSplit; uniform float uShadowTexel; uniform float uShadowStrength;',
    'uniform vec3 uCamPos; uniform vec3 uSunDir; uniform vec3 uSunCol;',
    'uniform vec3 uSkyCol; uniform vec3 uGroundCol;',
    'uniform vec3 uFogCol; uniform float uFogDensity; uniform float uFogHeight;',
    'uniform vec4 uLightPos[MAXL]; uniform vec4 uLightCol[MAXL]; uniform int uNumLights;',
    'uniform vec3 uTint; uniform float uEmissive; uniform float uAlpha;',
    'uniform float uTime;',
    '',
    'vec4 sampleAtlas(){',
    '  if (vCell < 0.0) return vec4(1.0);',
    '  float cells = float(' + ATLAS_CELLS + ');',
    '  vec2 cell = vec2(mod(vCell, cells), floor(vCell / cells));',
    '  vec2 f = fract(vUV) * 0.98 + 0.01;',
    '  vec2 uv = (cell + f) / cells;',
    '  vec2 dx = dFdx(vUV) / cells, dy = dFdy(vUV) / cells;',
    '  return textureGrad(uAtlas, uv, dx, dy);',
    '}',
    '',
    'float pcf(sampler2DShadow sm, vec3 uvz, float texel){',
    '  float s = 0.0;',
    '  for (int y = -1; y <= 1; y++) {',
    '    for (int x = -1; x <= 1; x++) {',
    '      s += texture(sm, vec3(uvz.xy + vec2(float(x), float(y)) * texel, uvz.z));',
    '    }',
    '  }',
    '  return s / 9.0;',
    '}',
    '',
    'float sunShadow(vec3 N){',
    '  vec3 off = vWorld + N * uShadowTexel * 2.4 * (vDepth > uSplit ? 220.0 : 60.0);',
    '  vec4 lp; float texel;',
    '  if (vDepth <= uSplit) { lp = uLightVP0 * vec4(off, 1.0); texel = uShadowTexel; }',
    '  else { lp = uLightVP1 * vec4(off, 1.0); texel = uShadowTexel; }',
    '  vec3 uvz = lp.xyz / lp.w * 0.5 + 0.5;',
    '  if (uvz.x < 0.0 || uvz.x > 1.0 || uvz.y < 0.0 || uvz.y > 1.0 || uvz.z > 1.0) return 1.0;',
    '  uvz.z -= 0.0015;',
    '  float s = (vDepth <= uSplit) ? pcf(uShadow0, uvz, texel) : pcf(uShadow1, uvz, texel);',
    '  // fade the shadow out at the very edge of the far cascade',
    '  vec2 e = abs(uvz.xy - 0.5) * 2.0;',
    '  float edge = 1.0 - smoothstep(0.85, 1.0, max(e.x, e.y));',
    '  return mix(1.0, s, edge * uShadowStrength);',
    '}',
    '',
    'void main(){',
    '  vec4 tex = sampleAtlas();',
    '  vec3 albedo = tex.rgb * vCol * uTint;',
    '  vec3 N = normalize(vNrm);',
    '  vec3 V = normalize(uCamPos - vWorld);',
    '  if (!gl_FrontFacing) N = -N;',
    '  vec3 L = normalize(uSunDir);',
    '  float rough = clamp(vMat.y, 0.05, 1.0);',
    '  float ndl = dot(N, L);',
    '  float wrapd = clamp((ndl + 0.3) / 1.3, 0.0, 1.0);',
    '  float sh = sunShadow(N);',
    '  vec3 H = normalize(L + V);',
    '  float spec = pow(max(dot(N, H), 0.0), mix(160.0, 6.0, rough)) * (1.0 - rough);',
    '  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);',
    '  vec3 col = albedo * (hemi + uSunCol * wrapd * sh);',
    '  col += uSunCol * spec * sh * 0.8;',
    '  for (int i = 0; i < MAXL; i++) {',
    '    if (i >= uNumLights) break;',
    '    vec3 d = uLightPos[i].xyz - vWorld;',
    '    float dist2 = dot(d, d);',
    '    float r = uLightPos[i].w;',
    '    if (dist2 > r * r) continue;',
    '    float dist = sqrt(dist2);',
    '    vec3 Ld = d / max(dist, 0.0001);',
    '    float att = clamp(1.0 - dist / r, 0.0, 1.0);',
    '    att *= att;',
    '    float nl = clamp((dot(N, Ld) + 0.25) / 1.25, 0.0, 1.0);',
    '    vec3 Hp = normalize(Ld + V);',
    '    float sp = pow(max(dot(N, Hp), 0.0), mix(160.0, 6.0, rough)) * (1.0 - rough);',
    '    col += uLightCol[i].rgb * uLightCol[i].w * att * (albedo * nl + sp * 0.35);',
    '  }',
    '  col += albedo * vMat.x * uEmissive;',
    '  // fog: distance + height, warmed toward the sun (cheap aerial perspective)',
    '  float fog = 1.0 - exp(-uFogDensity * vDepth);',
    '  float hf = exp(-max(vWorld.y - uFogHeight, 0.0) * 0.010);',
    '  fog *= mix(0.30, 1.0, hf);',
    '  float sunAmt = pow(max(dot(-V, L), 0.0), 6.0);',
    '  vec3 fogc = mix(uFogCol, uSunCol * 0.9 + uFogCol * 0.4, sunAmt * 0.7);',
    '  col = mix(col, fogc, clamp(fog, 0.0, 1.0));',
    '  outColor = vec4(col, uAlpha * tex.a);',
    '}'
  ].join('\n');

  var SHADOW_VS = [
    '#version 300 es',
    'precision highp float;',
    'layout(location=0) in vec3 aPos;',
    'uniform mat4 uLightVP; uniform mat4 uModel;',
    'void main(){ gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }'
  ].join('\n');

  var SHADOW_FS = [
    '#version 300 es',
    'precision highp float;',
    'void main(){}'
  ].join('\n');

  // Fullscreen triangle generated from gl_VertexID — no vertex buffer needed.
  var FS_VS = [
    '#version 300 es',
    'precision highp float;',
    'out vec2 vUV;',
    'void main(){',
    '  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));',
    '  vUV = p;',
    '  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var SKY_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUV; out vec4 outColor;',
    'uniform mat4 uInvViewProj; uniform vec3 uCamPos;',
    'uniform vec3 uSunDir; uniform vec3 uSunCol;',
    'uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;',
    'uniform float uStars; uniform float uTime;',
    '',
    'float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));',
    '  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);',
    '}',
    'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += vnoise(p) * a; p *= 2.03; a *= 0.5; } return s; }',
    '',
    'void main(){',
    '  vec4 ndc = vec4(vUV * 2.0 - 1.0, 1.0, 1.0);',
    '  vec4 wp = uInvViewProj * ndc;',
    '  vec3 dir = normalize(wp.xyz / wp.w - uCamPos);',
    '  float up = dir.y;',
    '  vec3 col = mix(uHorizon, uZenith, pow(clamp(up, 0.0, 1.0), 0.65));',
    '  col = mix(col, uGround, smoothstep(0.0, -0.22, up));',
    '  // stars',
    '  if (uStars > 0.001 && up > -0.05) {',
    '    vec2 sp = dir.xz / max(abs(dir.y) + 0.30, 0.05) * 26.0;',
    '    vec2 cellId = floor(sp);',
    '    float st = hash21(cellId);',
    '    // jitter the star inside its cell, then draw it as a point, not a tile',
    '    vec2 jitter = vec2(hash21(cellId + 7.13), hash21(cellId + 19.71)) - 0.5;',
    '    float d = length(fract(sp) - 0.5 - jitter * 0.7);',
    '    float tw = 0.55 + 0.45 * sin(uTime * 2.2 + st * 60.0);',
    '    float bright = smoothstep(0.975, 1.0, st);',
    '    float star = bright * smoothstep(0.11, 0.0, d) * tw;',
    '    col += vec3(0.82, 0.88, 1.0) * star * uStars * smoothstep(-0.05, 0.30, up);',
    '  }',
    '  // high thin clouds drifting over the desert',
    '  if (up > 0.008) {',
    '    vec2 cp = dir.xz / up * 0.55 + vec2(uTime * 0.006, uTime * 0.0035);',
    '    float c = fbm(cp * 1.6);',
    '    c = smoothstep(0.52, 0.86, c) * smoothstep(0.0, 0.22, up);',
    '    vec3 ccol = mix(uHorizon * 1.15, uSunCol * 0.85 + vec3(0.5), 0.45);',
    '    col = mix(col, ccol, c * 0.55);',
    '  }',
    '  // sun disc and bloom-friendly glow',
    '  float sd = max(dot(dir, normalize(uSunDir)), 0.0);',
    '  col += uSunCol * pow(sd, 900.0) * 12.0;',
    '  col += uSunCol * pow(sd, 22.0) * 0.55;',
    '  col += uSunCol * pow(sd, 5.0) * 0.14;',
    '  outColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var WATER_VS = [
    '#version 300 es',
    'precision highp float;',
    'layout(location=0) in vec3 aPos;',
    'uniform mat4 uViewProj; uniform mat4 uModel; uniform float uTime;',
    'out vec3 vWorld; out float vDepth;',
    'void main(){',
    '  vec4 wp = uModel * vec4(aPos, 1.0);',
    '  wp.y += sin(wp.x * 0.9 + uTime * 1.4) * 0.022 + cos(wp.z * 1.1 - uTime * 1.1) * 0.022;',
    '  vWorld = wp.xyz;',
    '  gl_Position = uViewProj * wp;',
    '  vDepth = gl_Position.w;',
    '}'
  ].join('\n');

  var WATER_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec3 vWorld; in float vDepth; out vec4 outColor;',
    'uniform vec3 uCamPos; uniform vec3 uSunDir; uniform vec3 uSunCol;',
    'uniform vec3 uSkyCol; uniform vec3 uFogCol; uniform float uFogDensity;',
    'uniform vec3 uDeep; uniform vec3 uShallow; uniform float uTime;',
    'float wave(vec2 p, float t){',
    '  return sin(p.x * 2.3 + t * 1.7) * 0.5 + sin(p.y * 3.1 - t * 1.3) * 0.35 + sin((p.x + p.y) * 1.7 + t * 0.9) * 0.3;',
    '}',
    'void main(){',
    '  vec2 p = vWorld.xz;',
    '  float e = 0.09;',
    '  float h = wave(p, uTime);',
    '  float hx = wave(p + vec2(e, 0.0), uTime), hz = wave(p + vec2(0.0, e), uTime);',
    '  vec3 N = normalize(vec3(-(hx - h) / e * 0.14, 1.0, -(hz - h) / e * 0.14));',
    '  vec3 V = normalize(uCamPos - vWorld);',
    '  vec3 L = normalize(uSunDir);',
    '  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);',
    '  vec3 base = mix(uDeep, uShallow, clamp(h * 0.5 + 0.5, 0.0, 1.0));',
    '  vec3 col = mix(base, uSkyCol * 1.25, clamp(fres * 0.9 + 0.06, 0.0, 1.0));',
    '  vec3 H = normalize(L + V);',
    '  col += uSunCol * pow(max(dot(N, H), 0.0), 240.0) * 2.2;',
    '  float fog = 1.0 - exp(-uFogDensity * vDepth);',
    '  col = mix(col, uFogCol, clamp(fog, 0.0, 1.0));',
    '  outColor = vec4(col, 0.90);',
    '}'
  ].join('\n');

  var BRIGHT_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUV; out vec4 outColor;',
    'uniform sampler2D uTex; uniform float uThreshold; uniform float uKnee;',
    'void main(){',
    '  vec3 c = texture(uTex, vUV).rgb;',
    '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  float s = clamp((l - uThreshold) / max(uKnee, 0.0001), 0.0, 1.0);',
    '  outColor = vec4(c * s * s, 1.0);',
    '}'
  ].join('\n');

  var BLUR_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUV; out vec4 outColor;',
    'uniform sampler2D uTex; uniform vec2 uDir;',
    'void main(){',
    '  vec3 c = texture(uTex, vUV).rgb * 0.227027;',
    '  c += texture(uTex, vUV + uDir * 1.3846).rgb * 0.316216;',
    '  c += texture(uTex, vUV - uDir * 1.3846).rgb * 0.316216;',
    '  c += texture(uTex, vUV + uDir * 3.2308).rgb * 0.070270;',
    '  c += texture(uTex, vUV - uDir * 3.2308).rgb * 0.070270;',
    '  outColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var COMPOSITE_FS = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUV; out vec4 outColor;',
    'uniform sampler2D uScene; uniform sampler2D uBloom;',
    'uniform vec2 uTexel;',
    'uniform float uExposure; uniform float uBloomAmt; uniform float uVignette;',
    'uniform float uGrain; uniform float uTime; uniform float uFxaa;',
    'uniform float uSaturation; uniform vec3 uColorLift;',
    '',
    'vec3 aces(vec3 x){',
    '  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;',
    '  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);',
    '}',
    'float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }',
    '',
    'vec3 fxaa(sampler2D tex, vec2 uv, vec2 texel){',
    '  vec3 rgbM = texture(tex, uv).rgb;',
    '  vec3 rgbNW = texture(tex, uv + vec2(-1.0, -1.0) * texel).rgb;',
    '  vec3 rgbNE = texture(tex, uv + vec2( 1.0, -1.0) * texel).rgb;',
    '  vec3 rgbSW = texture(tex, uv + vec2(-1.0,  1.0) * texel).rgb;',
    '  vec3 rgbSE = texture(tex, uv + vec2( 1.0,  1.0) * texel).rgb;',
    '  float lM = luma(rgbM), lNW = luma(rgbNW), lNE = luma(rgbNE), lSW = luma(rgbSW), lSE = luma(rgbSE);',
    '  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));',
    '  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));',
    '  if (lMax - lMin < max(0.05, lMax * 0.125)) return rgbM;',
    '  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));',
    '  float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);',
    '  float rcpDir = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);',
    '  dir = clamp(dir * rcpDir, -8.0, 8.0) * texel;',
    '  vec3 a = 0.5 * (texture(tex, uv + dir * (1.0 / 3.0 - 0.5)).rgb + texture(tex, uv + dir * (2.0 / 3.0 - 0.5)).rgb);',
    '  vec3 b = a * 0.5 + 0.25 * (texture(tex, uv - dir * 0.5).rgb + texture(tex, uv + dir * 0.5).rgb);',
    '  float lb = luma(b);',
    '  return (lb < lMin || lb > lMax) ? a : b;',
    '}',
    '',
    'void main(){',
    '  vec3 c = uFxaa > 0.5 ? fxaa(uScene, vUV, uTexel) : texture(uScene, vUV).rgb;',
    '  c += texture(uBloom, vUV).rgb * uBloomAmt;',
    '  c *= uExposure;',
    '  c = aces(c);',
    '  float l = luma(c);',
    '  c = mix(vec3(l), c, uSaturation);',
    '  c += uColorLift * (1.0 - l);',
    '  vec2 d = vUV - 0.5;',
    '  c *= 1.0 - uVignette * dot(d, d) * 1.9;',
    '  float g = fract(sin(dot(vUV * (1.0 + fract(uTime)), vec2(12.9898, 78.233))) * 43758.5453);',
    '  c += (g - 0.5) * uGrain;',
    '  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* -------------------------------------------------------------- program */

  function Program(gl, vsSrc, fsSrc, name) {
    this.gl = gl;
    this.name = name || 'program';
    var vs = compile(gl, gl.VERTEX_SHADER, vsSrc, name + ':vs');
    var fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc, name + ':fs');
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Link failed (' + name + '): ' + gl.getProgramInfoLog(p));
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    this.p = p;
    this.loc = {};
  }
  Program.prototype.use = function () { this.gl.useProgram(this.p); return this; };
  Program.prototype.u = function (n) {
    if (!(n in this.loc)) this.loc[n] = this.gl.getUniformLocation(this.p, n);
    return this.loc[n];
  };
  Program.prototype.f = function (n, v) { this.gl.uniform1f(this.u(n), v); return this; };
  Program.prototype.i = function (n, v) { this.gl.uniform1i(this.u(n), v); return this; };
  Program.prototype.v2 = function (n, x, y) { this.gl.uniform2f(this.u(n), x, y); return this; };
  Program.prototype.v3 = function (n, x, y, z) {
    if (typeof x === 'object') this.gl.uniform3f(this.u(n), x[0] !== undefined ? x[0] : x.x, x[1] !== undefined ? x[1] : x.y, x[2] !== undefined ? x[2] : x.z);
    else this.gl.uniform3f(this.u(n), x, y, z);
    return this;
  };
  Program.prototype.v4a = function (n, arr) { this.gl.uniform4fv(this.u(n), arr); return this; };
  Program.prototype.m4 = function (n, m) { this.gl.uniformMatrix4fv(this.u(n), false, m); return this; };
  Program.prototype.m3 = function (n, m) { this.gl.uniformMatrix3fv(this.u(n), false, m); return this; };

  function compile(gl, type, src, label) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      var lines = src.split('\n').map(function (l, i) { return (i + 1) + ': ' + l; }).join('\n');
      throw new Error('Shader compile failed (' + label + '): ' + log + '\n' + lines);
    }
    return s;
  }

  /* ----------------------------------------------------------------- mesh */

  var STRIDE_FLOATS = 14; // pos3 nrm3 uv2 cell1 col3 mat2

  function Mesh(gl, verts, indices, dynamic) {
    this.gl = gl;
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();
    this.count = 0;
    this.dynamic = !!dynamic;
    this.min = { x: 0, y: 0, z: 0 };
    this.max = { x: 0, y: 0, z: 0 };
    var usage = dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, verts, usage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, usage);
    var st = STRIDE_FLOATS * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, st, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 32);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 3, gl.FLOAT, false, st, 36);
    gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 2, gl.FLOAT, false, st, 48);
    gl.bindVertexArray(null);

    this.count = indices.length;
    this.capV = verts.length;
    this.capI = indices.length;
    this.computeBounds(verts);
  }
  Mesh.prototype.computeBounds = function (verts) {
    var inf = Infinity;
    var mnx = inf, mny = inf, mnz = inf, mxx = -inf, mxy = -inf, mxz = -inf;
    for (var i = 0; i < verts.length; i += STRIDE_FLOATS) {
      var x = verts[i], y = verts[i + 1], z = verts[i + 2];
      if (x < mnx) mnx = x; if (y < mny) mny = y; if (z < mnz) mnz = z;
      if (x > mxx) mxx = x; if (y > mxy) mxy = y; if (z > mxz) mxz = z;
    }
    if (mnx === inf) { mnx = mny = mnz = mxx = mxy = mxz = 0; }
    this.min.x = mnx; this.min.y = mny; this.min.z = mnz;
    this.max.x = mxx; this.max.y = mxy; this.max.z = mxz;
  };
  /** Re-upload geometry (dynamic meshes: tentacles, ropes, carried props). */
  Mesh.prototype.update = function (verts, indices) {
    var gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    if (verts.length > this.capV) { gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW); this.capV = verts.length; }
    else gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    if (indices.length > this.capI) { gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW); this.capI = indices.length; }
    else gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, indices);
    this.count = indices.length;
    this.computeBounds(verts);
  };
  Mesh.prototype.dispose = function () {
    var gl = this.gl;
    gl.deleteVertexArray(this.vao); gl.deleteBuffer(this.vbo); gl.deleteBuffer(this.ibo);
  };

  /* ------------------------------------------------------------- renderer */

  function Renderer(canvas, opts) {
    opts = opts || {};
    var attrs = {
      alpha: false, antialias: false, depth: true, stencil: false,
      powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserveDrawingBuffer,
      failIfMajorPerformanceCaveat: false
    };
    var gl = canvas.getContext('webgl2', attrs);
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    this.gl = gl;
    this.canvas = canvas;
    this.width = 1; this.height = 1;
    this.pixelRatio = 1;

    this.floatColor = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    var af = gl.getExtension('EXT_texture_filter_anisotropic');
    this.aniso = af ? { ext: af, max: gl.getParameter(af.MAX_TEXTURE_MAX_ANISOTROPY_EXT) } : null;
    gl.getExtension('OES_texture_float_linear');

    this.progScene = new Program(gl, SCENE_VS, SCENE_FS, 'scene');
    this.progShadow = new Program(gl, SHADOW_VS, SHADOW_FS, 'shadow');
    this.progSky = new Program(gl, FS_VS, SKY_FS, 'sky');
    this.progWater = new Program(gl, WATER_VS, WATER_FS, 'water');
    this.progBright = new Program(gl, FS_VS, BRIGHT_FS, 'bright');
    this.progBlur = new Program(gl, FS_VS, BLUR_FS, 'blur');
    this.progComposite = new Program(gl, FS_VS, COMPOSITE_FS, 'composite');

    this.emptyVao = gl.createVertexArray();

    this.shadowSize = opts.shadowSize || 2048;
    this.shadow = [this._makeShadow(this.shadowSize), this._makeShadow(this.shadowSize)];
    this.lightVP = [M4.create(), M4.create()];
    this.cascadeSplit = 55;

    this.sceneFbo = null;
    this.bloomFbo = [];
    this.atlas = null;

    // per-frame state
    this.viewProj = M4.create();
    this.view = M4.create();
    this.proj = M4.create();
    this.invViewProj = M4.create();
    this.frustum = new OCTO.Frustum();
    this.shadowFrustum = [new OCTO.Frustum(), new OCTO.Frustum()];
    this._normalMat = new Float32Array(9);
    this._tmpM = M4.create();
    this.lightPosArr = new Float32Array(MAX_LIGHTS * 4);
    this.lightColArr = new Float32Array(MAX_LIGHTS * 4);
    this.numLights = 0;

    this.stats = { draws: 0, tris: 0, culled: 0, shadowDraws: 0 };

    this.env = {
      sunDir: { x: 0.45, y: 0.72, z: 0.52 },
      sunCol: [1.05, 0.93, 0.74],
      skyCol: [0.19, 0.25, 0.36],
      groundCol: [0.15, 0.12, 0.09],
      fogCol: [0.62, 0.56, 0.47],
      fogDensity: 0.0026,
      fogHeight: 26,
      zenith: [0.13, 0.30, 0.66],
      horizon: [0.78, 0.68, 0.52],
      groundSky: [0.28, 0.23, 0.17],
      stars: 0,
      exposure: 1.0,
      bloom: 0.75,
      bloomThreshold: 1.0,
      saturation: 1.12,
      colorLift: [0.0, 0.0, 0.0],
      vignette: 0.42,
      grain: 0.018,
      emissive: 2.4,
      shadowStrength: 1.0
    };
    this.quality = {
      shadows: true, bloom: true, fxaa: true, water: true, lights: MAX_LIGHTS,
      drawDistance: 520, renderScale: 1
    };
    this.time = 0;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0, 0, 0, 1);
  }

  Renderer.prototype._makeShadow = function (size) {
    var gl = this.gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: tex, fbo: fbo, size: size };
  };

  Renderer.prototype._makeColorTarget = function (w, h, withDepth, float) {
    var gl = this.gl;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var internal = (float && this.floatColor) ? gl.RGBA16F : gl.RGBA8;
    var type = (float && this.floatColor) ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    var depth = null;
    if (withDepth) {
      depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    }
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex: tex, fbo: fbo, depth: depth, w: w, h: h, ok: ok };
  };

  Renderer.prototype.resize = function (w, h, pixelRatio) {
    var gl = this.gl;
    this.pixelRatio = pixelRatio || 1;
    var scale = this.quality.renderScale || 1;
    w = Math.max(2, Math.floor(w * this.pixelRatio * scale));
    h = Math.max(2, Math.floor(h * this.pixelRatio * scale));
    if (w === this.width && h === this.height && this.sceneFbo) return;
    this.width = w; this.height = h;
    this.canvas.width = w; this.canvas.height = h;

    if (this.sceneFbo) {
      gl.deleteTexture(this.sceneFbo.tex); gl.deleteFramebuffer(this.sceneFbo.fbo);
      if (this.sceneFbo.depth) gl.deleteRenderbuffer(this.sceneFbo.depth);
      for (var i = 0; i < this.bloomFbo.length; i++) {
        gl.deleteTexture(this.bloomFbo[i].tex); gl.deleteFramebuffer(this.bloomFbo[i].fbo);
      }
    }
    this.sceneFbo = this._makeColorTarget(w, h, true, true);
    var bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2);
    this.bloomFbo = [
      this._makeColorTarget(bw, bh, false, true),
      this._makeColorTarget(bw, bh, false, true)
    ];
  };

  /** Upload the procedural atlas (an HTMLCanvasElement or ImageData source). */
  Renderer.prototype.setAtlas = function (source) {
    var gl = this.gl;
    if (!this.atlas) this.atlas = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, this.aniso.max));
  };

  Renderer.prototype.createMesh = function (verts, indices, dynamic) {
    return new Mesh(this.gl, verts, indices, dynamic);
  };

  /** Fit an orthographic light matrix around a world-space sphere. */
  Renderer.prototype._fitCascade = function (out, center, radius, texelSnap) {
    var sun = this.env.sunDir;
    var d = 260;
    var eye = { x: center.x + sun.x * d, y: center.y + sun.y * d, z: center.z + sun.z * d };
    var up = Math.abs(sun.y) > 0.95 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
    var view = this._tmpM;
    M4.lookAt(view, eye, center, up);
    if (texelSnap) {
      // Snap the light-space centre to a texel grid so shadows stop shimmering.
      var c = { x: 0, y: 0, z: 0 };
      M4.transformPoint(c, view, center);
      var texelWorld = (radius * 2) / this.shadowSize;
      c.x = Math.round(c.x / texelWorld) * texelWorld;
      c.y = Math.round(c.y / texelWorld) * texelWorld;
      var inv = M4.create();
      M4.invert(inv, view);
      var snapped = { x: 0, y: 0, z: 0 };
      M4.transformPoint(snapped, inv, c);
      eye = { x: snapped.x + sun.x * d, y: snapped.y + sun.y * d, z: snapped.z + sun.z * d };
      M4.lookAt(view, eye, snapped, up);
    }
    var proj = M4.create();
    M4.ortho(proj, -radius, radius, -radius, radius, 1, d * 2.2);
    M4.mul(out, proj, view);
    return out;
  };

  /**
   * Render one frame.
   *   camera : { pos, target, up, fov, near, far }
   *   scene  : { items: [{mesh, model, tint, emissive, alpha, wind, cell, noShadow, blend}],
   *              water: [...], lights: [{pos, color, radius, intensity}] }
   */
  Renderer.prototype.render = function (camera, scene, dt) {
    var gl = this.gl;
    this.time += dt || 0;
    var env = this.env, q = this.quality;
    this.stats.draws = 0; this.stats.tris = 0; this.stats.culled = 0; this.stats.shadowDraws = 0;

    var aspect = this.width / this.height;
    M4.perspective(this.proj, camera.fov, aspect, camera.near, Math.min(camera.far, q.drawDistance * 2.6));
    M4.lookAt(this.view, camera.pos, camera.target, camera.up || { x: 0, y: 1, z: 0 });
    M4.mul(this.viewProj, this.proj, this.view);
    M4.invert(this.invViewProj, this.viewProj);
    this.frustum.fromViewProj(this.viewProj);

    this._collectLights(scene.lights, camera.pos);

    /* ---- shadow cascades ---- */
    if (q.shadows) {
      var fwd = { x: camera.target.x - camera.pos.x, y: 0, z: camera.target.z - camera.pos.z };
      V3.norm(fwd, fwd);
      var c0 = { x: camera.pos.x + fwd.x * 22, y: camera.pos.y, z: camera.pos.z + fwd.z * 22 };
      var c1 = { x: camera.pos.x + fwd.x * 110, y: camera.pos.y, z: camera.pos.z + fwd.z * 110 };
      this._fitCascade(this.lightVP[0], c0, 46, true);
      this._fitCascade(this.lightVP[1], c1, 175, true);
      this.shadowFrustum[0].fromViewProj(this.lightVP[0]);
      this.shadowFrustum[1].fromViewProj(this.lightVP[1]);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      // Front-face culling in the depth pass keeps peter-panning off flat walls.
      gl.cullFace(gl.FRONT);
      this.progShadow.use();
      for (var ci = 0; ci < 2; ci++) {
        var sm = this.shadow[ci];
        gl.bindFramebuffer(gl.FRAMEBUFFER, sm.fbo);
        gl.viewport(0, 0, sm.size, sm.size);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        this.progShadow.m4('uLightVP', this.lightVP[ci]);
        for (var i = 0; i < scene.items.length; i++) {
          var it = scene.items[i];
          if (it.noShadow || it.blend) continue;
          if (!this._visible(it, this.shadowFrustum[ci])) continue;
          this.progShadow.m4('uModel', it.model);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawElements(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0);
          this.stats.shadowDraws++;
        }
      }
      gl.cullFace(gl.BACK);
    }

    /* ---- main pass into the HDR buffer ---- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo.fbo);
    gl.viewport(0, 0, this.width, this.height);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Sky first, with depth writes off, so it fills everything not covered later.
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    var sky = this.progSky.use();
    sky.m4('uInvViewProj', this.invViewProj);
    sky.v3('uCamPos', camera.pos);
    sky.v3('uSunDir', env.sunDir);
    sky.v3('uSunCol', env.sunCol);
    sky.v3('uZenith', env.zenith);
    sky.v3('uHorizon', env.horizon);
    sky.v3('uGround', env.groundSky);
    sky.f('uStars', env.stars);
    sky.f('uTime', this.time);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);

    var p = this.progScene.use();
    p.m4('uViewProj', this.viewProj);
    p.v3('uCamPos', camera.pos);
    p.v3('uSunDir', env.sunDir);
    p.v3('uSunCol', env.sunCol);
    p.v3('uSkyCol', env.skyCol);
    p.v3('uGroundCol', env.groundCol);
    p.v3('uFogCol', env.fogCol);
    p.f('uFogDensity', env.fogDensity);
    p.f('uFogHeight', env.fogHeight);
    p.f('uTime', this.time);
    p.f('uSplit', q.shadows ? this.cascadeSplit : -1);
    p.f('uShadowTexel', 1 / this.shadowSize);
    p.f('uShadowStrength', q.shadows ? env.shadowStrength : 0);
    p.i('uNumLights', this.numLights);
    p.v4a('uLightPos', this.lightPosArr);
    p.v4a('uLightCol', this.lightColArr);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    p.i('uAtlas', 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow[0].tex);
    p.i('uShadow0', 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.shadow[1].tex);
    p.i('uShadow1', 2);
    p.m4('uLightVP0', this.lightVP[0]);
    p.m4('uLightVP1', this.lightVP[1]);

    var opaque = [], blended = [];
    for (var k = 0; k < scene.items.length; k++) {
      var item = scene.items[k];
      if (!this._visible(item, this.frustum)) { this.stats.culled++; continue; }
      (item.blend ? blended : opaque).push(item);
    }
    gl.disable(gl.BLEND);
    this._drawList(p, opaque);

    /* ---- water ---- */
    if (q.water && scene.water && scene.water.length) {
      var wp = this.progWater.use();
      wp.m4('uViewProj', this.viewProj);
      wp.v3('uCamPos', camera.pos);
      wp.v3('uSunDir', env.sunDir);
      wp.v3('uSunCol', env.sunCol);
      wp.v3('uSkyCol', env.skyCol);
      wp.v3('uFogCol', env.fogCol);
      wp.f('uFogDensity', env.fogDensity);
      wp.f('uTime', this.time);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (var wi = 0; wi < scene.water.length; wi++) {
        var w = scene.water[wi];
        if (!this._visible(w, this.frustum)) continue;
        wp.m4('uModel', w.model);
        wp.v3('uDeep', w.deep || [0.03, 0.16, 0.20]);
        wp.v3('uShallow', w.shallow || [0.14, 0.44, 0.46]);
        gl.bindVertexArray(w.mesh.vao);
        gl.drawElements(gl.TRIANGLES, w.mesh.count, gl.UNSIGNED_INT, 0);
        this.stats.draws++;
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    /* ---- blended geometry (glass, holograms, awning gauze) ---- */
    if (blended.length) {
      this.progScene.use();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      blended.sort(function (a, b) {
        var da = distSq(a.model, camera.pos), db = distSq(b.model, camera.pos);
        return db - da;
      });
      this._drawList(this.progScene, blended);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    /* ---- post ---- */
    this._post();
    gl.bindVertexArray(null);
  };

  function distSq(model, p) {
    var dx = model[12] - p.x, dy = model[13] - p.y, dz = model[14] - p.z;
    return dx * dx + dy * dy + dz * dz;
  }

  Renderer.prototype._drawList = function (p, list) {
    var gl = this.gl;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      p.m4('uModel', it.model);
      M4.normalMatrix(this._normalMat, it.model);
      p.m3('uNormalMat', this._normalMat);
      var t = it.tint;
      if (t) p.v3('uTint', t[0], t[1], t[2]); else p.v3('uTint', 1, 1, 1);
      p.f('uEmissive', it.emissive === undefined ? this.env.emissive : it.emissive);
      p.f('uAlpha', it.alpha === undefined ? 1 : it.alpha);
      p.f('uWind', it.wind || 0);
      gl.bindVertexArray(it.mesh.vao);
      gl.drawElements(gl.TRIANGLES, it.mesh.count, gl.UNSIGNED_INT, 0);
      this.stats.draws++;
      this.stats.tris += it.mesh.count / 3;
    }
  };

  var _mn = { x: 0, y: 0, z: 0 }, _mx = { x: 0, y: 0, z: 0 };
  Renderer.prototype._visible = function (item, frustum) {
    if (item.alwaysVisible) return true;
    var m = item.model, mesh = item.mesh;
    // Transform the local AABB by the model matrix (axis-aligned re-fit).
    var cx = (mesh.min.x + mesh.max.x) * 0.5, cy = (mesh.min.y + mesh.max.y) * 0.5, cz = (mesh.min.z + mesh.max.z) * 0.5;
    var ex = (mesh.max.x - mesh.min.x) * 0.5, ey = (mesh.max.y - mesh.min.y) * 0.5, ez = (mesh.max.z - mesh.min.z) * 0.5;
    var wx = m[0] * cx + m[4] * cy + m[8] * cz + m[12];
    var wy = m[1] * cx + m[5] * cy + m[9] * cz + m[13];
    var wz = m[2] * cx + m[6] * cy + m[10] * cz + m[14];
    var rx = Math.abs(m[0]) * ex + Math.abs(m[4]) * ey + Math.abs(m[8]) * ez;
    var ry = Math.abs(m[1]) * ex + Math.abs(m[5]) * ey + Math.abs(m[9]) * ez;
    var rz = Math.abs(m[2]) * ex + Math.abs(m[6]) * ey + Math.abs(m[10]) * ez;
    _mn.x = wx - rx; _mn.y = wy - ry; _mn.z = wz - rz;
    _mx.x = wx + rx; _mx.y = wy + ry; _mx.z = wz + rz;
    return frustum.intersectsAABB(_mn, _mx);
  };

  Renderer.prototype._collectLights = function (lights, camPos) {
    var n = 0, max = Math.min(this.quality.lights, MAX_LIGHTS);
    if (!lights || max <= 0) { this.numLights = 0; return; }
    // Keep the strongest nearby lights; a simple score beats a full sort here.
    var scored = [];
    for (var i = 0; i < lights.length; i++) {
      var l = lights[i];
      if (l.intensity <= 0) continue;
      var dx = l.pos.x - camPos.x, dy = l.pos.y - camPos.y, dz = l.pos.z - camPos.z;
      var d2 = dx * dx + dy * dy + dz * dz;
      var reach = l.radius + 90;
      if (d2 > reach * reach) continue;
      scored.push({ l: l, s: d2 / Math.max(l.intensity, 0.01) });
    }
    scored.sort(function (a, b) { return a.s - b.s; });
    for (var j = 0; j < scored.length && n < max; j++) {
      var L = scored[j].l;
      this.lightPosArr[n * 4] = L.pos.x;
      this.lightPosArr[n * 4 + 1] = L.pos.y;
      this.lightPosArr[n * 4 + 2] = L.pos.z;
      this.lightPosArr[n * 4 + 3] = L.radius;
      this.lightColArr[n * 4] = L.color[0];
      this.lightColArr[n * 4 + 1] = L.color[1];
      this.lightColArr[n * 4 + 2] = L.color[2];
      this.lightColArr[n * 4 + 3] = L.intensity;
      n++;
    }
    for (; n < max; n++) { this.lightPosArr[n * 4 + 3] = 0; this.lightColArr[n * 4 + 3] = 0; }
    this.numLights = Math.min(scored.length, max);
  };

  Renderer.prototype._post = function () {
    var gl = this.gl, env = this.env, q = this.quality;
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.emptyVao);

    var bloomTex = this.bloomFbo[0].tex;
    if (q.bloom) {
      var b0 = this.bloomFbo[0], b1 = this.bloomFbo[1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, b0.fbo);
      gl.viewport(0, 0, b0.w, b0.h);
      var bp = this.progBright.use();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.sceneFbo.tex);
      bp.i('uTex', 0).f('uThreshold', env.bloomThreshold).f('uKnee', 0.7);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      var bl = this.progBlur.use();
      bl.i('uTex', 0);
      for (var pass = 0; pass < 2; pass++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, b1.fbo);
        gl.viewport(0, 0, b1.w, b1.h);
        gl.bindTexture(gl.TEXTURE_2D, b0.tex);
        bl.v2('uDir', 1 / b0.w, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindFramebuffer(gl.FRAMEBUFFER, b0.fbo);
        gl.viewport(0, 0, b0.w, b0.h);
        gl.bindTexture(gl.TEXTURE_2D, b1.tex);
        bl.v2('uDir', 0, 1 / b0.h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      bloomTex = b0.tex;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    var cp = this.progComposite.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFbo.tex);
    cp.i('uScene', 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloomTex);
    cp.i('uBloom', 1);
    cp.v2('uTexel', 1 / this.width, 1 / this.height);
    cp.f('uExposure', env.exposure);
    cp.f('uBloomAmt', q.bloom ? env.bloom : 0);
    cp.f('uVignette', env.vignette);
    cp.f('uGrain', env.grain);
    cp.f('uTime', this.time);
    cp.f('uFxaa', q.fxaa ? 1 : 0);
    cp.f('uSaturation', env.saturation);
    cp.v3('uColorLift', env.colorLift);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  };

  OCTO.gl = {
    Renderer: Renderer,
    Mesh: Mesh,
    Program: Program,
    STRIDE_FLOATS: STRIDE_FLOATS,
    ATLAS_CELLS: ATLAS_CELLS,
    MAX_LIGHTS: MAX_LIGHTS
  };

})(typeof window !== 'undefined' ? window : globalThis);
