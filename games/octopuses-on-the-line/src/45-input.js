/* =====================================================================
 * OCTOPUSES ON THE LINE — 45-input.js
 * Unified input: keyboard + mouse (pointer lock), touch (twin virtual
 * sticks + action pad) and gamepad. Everything downstream reads actions,
 * never raw keys.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var clamp = OCTO.util.clamp;

  var DEFAULT_BINDINGS = {
    forward: ['KeyW', 'ArrowUp'],
    back: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    jump: ['Space'],
    sprint: ['ShiftLeft', 'ShiftRight'],
    grip: ['KeyQ'],
    climb: ['KeyC'],
    dash: ['KeyF'],
    grab: ['KeyE'],
    wobble: ['KeyR'],
    interact: ['KeyE'],
    map: ['KeyM'],
    photo: ['KeyP'],
    lang: ['KeyL'],
    pause: ['Escape'],
    beta: ['F1'],
    camNear: ['BracketLeft'],
    camFar: ['BracketRight']
  };

  function Input(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.bindings = opts.bindings || DEFAULT_BINDINGS;
    this.down = Object.create(null);
    this.pressed = Object.create(null);
    this.released = Object.create(null);
    this.mouse = { dx: 0, dy: 0, wheel: 0, locked: false, left: false, right: false };
    this.touch = { active: false, move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, buttons: Object.create(null) };
    this.gamepadIndex = -1;
    this.pad = { lx: 0, ly: 0, rx: 0, ry: 0, buttons: [] };
    this.enabled = true;
    this.lookSensitivity = opts.lookSensitivity || 0.0026;
    this.invertY = false;
    this._listeners = [];
    this._install();
  }

  Input.prototype._on = function (target, type, fn, opt) {
    target.addEventListener(type, fn, opt);
    this._listeners.push([target, type, fn, opt]);
  };

  Input.prototype._install = function () {
    var self = this;

    this._on(window, 'keydown', function (e) {
      if (!self.enabled) return;
      // Let the browser keep its own shortcuts when a modifier is held.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!self.down[e.code]) self.pressed[e.code] = true;
      self.down[e.code] = true;
      if (SWALLOW[e.code]) e.preventDefault();
    });
    this._on(window, 'keyup', function (e) {
      self.down[e.code] = false;
      self.released[e.code] = true;
    });
    this._on(window, 'blur', function () {
      self.down = Object.create(null);
      self.touch.move.x = self.touch.move.y = 0;
      self.touch.look.x = self.touch.look.y = 0;
    });

    this._on(this.canvas, 'mousedown', function (e) {
      if (e.button === 0) self.mouse.left = true;
      if (e.button === 2) self.mouse.right = true;
    });
    this._on(window, 'mouseup', function (e) {
      if (e.button === 0) self.mouse.left = false;
      if (e.button === 2) self.mouse.right = false;
    });
    this._on(this.canvas, 'contextmenu', function (e) { e.preventDefault(); });
    this._on(window, 'mousemove', function (e) {
      if (self.mouse.locked) {
        self.mouse.dx += e.movementX || 0;
        self.mouse.dy += e.movementY || 0;
      } else if (self.mouse.left) {
        self.mouse.dx += e.movementX || 0;
        self.mouse.dy += e.movementY || 0;
      }
    });
    this._on(this.canvas, 'wheel', function (e) {
      self.mouse.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    this._on(document, 'pointerlockchange', function () {
      self.mouse.locked = document.pointerLockElement === self.canvas;
    });

    this._on(window, 'gamepadconnected', function (e) { self.gamepadIndex = e.gamepad.index; });
    this._on(window, 'gamepaddisconnected', function () { self.gamepadIndex = -1; });
  };

  var SWALLOW = {
    Space: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
    KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, F1: 1, Tab: 1
  };

  Input.prototype.requestLock = function () {
    if (this.canvas.requestPointerLock) this.canvas.requestPointerLock();
  };
  Input.prototype.exitLock = function () {
    if (document.exitPointerLock) document.exitPointerLock();
  };

  Input.prototype._anyDown = function (codes) {
    for (var i = 0; i < codes.length; i++) if (this.down[codes[i]]) return true;
    return false;
  };
  Input.prototype._anyPressed = function (codes) {
    for (var i = 0; i < codes.length; i++) if (this.pressed[codes[i]]) return true;
    return false;
  };

  /** Is the action currently held? */
  Input.prototype.held = function (action) {
    var b = this.bindings[action];
    if (b && this._anyDown(b)) return true;
    if (this.touch.buttons[action]) return true;
    var padMap = PAD_BUTTONS[action];
    if (padMap !== undefined && this.pad.buttons[padMap]) return true;
    return false;
  };
  /** Did the action go down this frame? */
  Input.prototype.hit = function (action) {
    var b = this.bindings[action];
    if (b && this._anyPressed(b)) return true;
    if (this.touch.buttons[action] === 1) return true;
    var padMap = PAD_BUTTONS[action];
    if (padMap !== undefined && this.pad.buttons[padMap] === 1) return true;
    return false;
  };

  var PAD_BUTTONS = {
    jump: 0, grab: 2, wobble: 1, dash: 3,
    sprint: 10, grip: 6, climb: 4, interact: 2, map: 8, pause: 9
  };

  /** Movement vector in screen space, magnitude <= 1. */
  Input.prototype.moveAxis = function (out) {
    out = out || { x: 0, y: 0 };
    var x = 0, y = 0;
    if (this.held('left')) x -= 1;
    if (this.held('right')) x += 1;
    if (this.held('forward')) y += 1;
    if (this.held('back')) y -= 1;
    x += this.touch.move.x; y += this.touch.move.y;
    x += this.pad.lx; y -= this.pad.ly;
    var l = Math.sqrt(x * x + y * y);
    if (l > 1) { x /= l; y /= l; }
    out.x = x; out.y = y;
    return out;
  };

  /** Look delta for this frame, in radians. */
  Input.prototype.lookDelta = function (out) {
    out = out || { x: 0, y: 0 };
    var sx = this.mouse.dx * this.lookSensitivity;
    var sy = this.mouse.dy * this.lookSensitivity * (this.invertY ? -1 : 1);
    sx += this.touch.look.x * 0.055;
    sy += this.touch.look.y * 0.055;
    sx += this.pad.rx * 0.045;
    sy += this.pad.ry * 0.045 * (this.invertY ? -1 : 1);
    out.x = sx; out.y = sy;
    return out;
  };

  /** Call once per frame, after all systems have read input. */
  Input.prototype.endFrame = function () {
    this.pressed = Object.create(null);
    this.released = Object.create(null);
    this.mouse.dx = 0; this.mouse.dy = 0; this.mouse.wheel = 0;
    this.touch.look.x = 0; this.touch.look.y = 0;
    for (var k in this.touch.buttons) {
      if (this.touch.buttons[k] === 1) this.touch.buttons[k] = 2;
    }
    for (var i = 0; i < this.pad.buttons.length; i++) {
      if (this.pad.buttons[i] === 1) this.pad.buttons[i] = 2;
    }
  };

  /** Call at the start of each frame to sample the gamepad. */
  Input.prototype.poll = function () {
    if (!navigator.getGamepads) return;
    var pads = navigator.getGamepads();
    var gp = null;
    for (var i = 0; i < pads.length; i++) { if (pads[i] && pads[i].connected) { gp = pads[i]; break; } }
    if (!gp) { this.pad.lx = this.pad.ly = this.pad.rx = this.pad.ry = 0; return; }
    function dz(v) { return Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82; }
    this.pad.lx = dz(gp.axes[0] || 0);
    this.pad.ly = dz(gp.axes[1] || 0) * -1;
    this.pad.rx = dz(gp.axes[2] || 0);
    this.pad.ry = dz(gp.axes[3] || 0);
    for (var b = 0; b < gp.buttons.length; b++) {
      var on = gp.buttons[b].pressed;
      var prev = this.pad.buttons[b] || 0;
      this.pad.buttons[b] = on ? (prev ? 2 : 1) : 0;
    }
  };

  /* --------------------------------------------------------- touch rig */

  /**
   * Attaches a left stick (movement), a right look area and an action
   * pad. Returns the root element so the UI can show/hide it.
   */
  Input.prototype.attachTouch = function (container, actions) {
    var self = this;
    this.touch.active = true;
    var root = document.createElement('div');
    root.className = 'octo-touch';
    root.innerHTML =
      '<div class="octo-stick" id="octo-stick"><div class="octo-knob"></div></div>' +
      '<div class="octo-look" id="octo-look"></div>' +
      '<div class="octo-buttons" id="octo-buttons"></div>';
    container.appendChild(root);

    var stick = root.querySelector('#octo-stick');
    var knob = root.querySelector('.octo-knob');
    var look = root.querySelector('#octo-look');
    var btns = root.querySelector('#octo-buttons');

    var stickId = null, stickOrigin = { x: 0, y: 0 };
    function stickStart(e) {
      var t = e.changedTouches[0];
      stickId = t.identifier;
      var r = stick.getBoundingClientRect();
      stickOrigin.x = r.left + r.width / 2;
      stickOrigin.y = r.top + r.height / 2;
      e.preventDefault();
    }
    function stickMove(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier !== stickId) continue;
        var dx = t.clientX - stickOrigin.x, dy = t.clientY - stickOrigin.y;
        var max = 56;
        var l = Math.sqrt(dx * dx + dy * dy);
        if (l > max) { dx = dx / l * max; dy = dy / l * max; }
        self.touch.move.x = dx / max;
        self.touch.move.y = -dy / max;
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        e.preventDefault();
      }
    }
    function stickEnd(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === stickId) {
          stickId = null;
          self.touch.move.x = self.touch.move.y = 0;
          knob.style.transform = 'translate(0,0)';
        }
      }
    }
    this._on(stick, 'touchstart', stickStart, { passive: false });
    this._on(window, 'touchmove', stickMove, { passive: false });
    this._on(window, 'touchend', stickEnd);
    this._on(window, 'touchcancel', stickEnd);

    var lookId = null, lookPrev = { x: 0, y: 0 };
    this._on(look, 'touchstart', function (e) {
      var t = e.changedTouches[0];
      lookId = t.identifier; lookPrev.x = t.clientX; lookPrev.y = t.clientY;
      e.preventDefault();
    }, { passive: false });
    this._on(window, 'touchmove', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier !== lookId) continue;
        self.touch.look.x += (t.clientX - lookPrev.x) * 0.06;
        self.touch.look.y += (t.clientY - lookPrev.y) * 0.06;
        lookPrev.x = t.clientX; lookPrev.y = t.clientY;
      }
    }, { passive: false });
    this._on(window, 'touchend', function (e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookId) lookId = null;
      }
    });

    actions.forEach(function (a) {
      var el = document.createElement('button');
      el.className = 'octo-btn octo-btn-' + a.action;
      el.textContent = a.label;
      el.setAttribute('aria-label', a.aria || a.label);
      btns.appendChild(el);
      function on(e) { self.touch.buttons[a.action] = 1; e.preventDefault(); }
      function off(e) { self.touch.buttons[a.action] = 0; e.preventDefault(); }
      self._on(el, 'touchstart', on, { passive: false });
      self._on(el, 'touchend', off, { passive: false });
      self._on(el, 'touchcancel', off, { passive: false });
      self._on(el, 'mousedown', on);
      self._on(el, 'mouseup', off);
      self._on(el, 'mouseleave', off);
    });
    return root;
  };

  Input.prototype.dispose = function () {
    for (var i = 0; i < this._listeners.length; i++) {
      var l = this._listeners[i];
      l[0].removeEventListener(l[1], l[2], l[3]);
    }
    this._listeners.length = 0;
  };

  OCTO.Input = Input;
  OCTO.DEFAULT_BINDINGS = DEFAULT_BINDINGS;

})(typeof window !== 'undefined' ? window : globalThis);
