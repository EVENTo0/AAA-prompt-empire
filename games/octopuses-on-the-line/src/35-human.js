/* =====================================================================
 * OCTOPUSES ON THE LINE — 35-human.js
 *
 * The Line-Walker avatar: a stylised human built entirely from the
 * procedural mesh primitives, with a hand-authored walk cycle and
 * per-class gear. Proportions are deliberately chunky so the silhouette
 * still reads at the distance the third-person camera sits at.
 *
 * No skeleton, no skinning: each limb is a rigid segment placed by the
 * transform stack. At this scale and style that is indistinguishable
 * from a skinned rig, and it costs nothing to author.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;
  var CELL = OCTO.CELL, TAU = OCTO.TAU;
  var U = OCTO.util, clamp = U.clamp;

  // Segment lengths, in world units. Total standing height ~1.62.
  var P = {
    hip: 0.80,        // pelvis height when standing
    thigh: 0.40,
    shin: 0.38,
    footLen: 0.24,
    torso: 0.46,
    neck: 0.07,
    headR: 0.155,
    shoulder: 0.19,   // half-width between shoulders
    upperArm: 0.30,
    foreArm: 0.28,
    hipHalf: 0.105
  };

  /**
   * Pose the avatar and emit it in world space.
   *
   *   p  the player (pos, visualYaw, bodyTilt, squash, speed, state,
   *      walkPhase, classDef)
   */
  function buildHuman(mb, p, quality) {
    var cls = p.classDef || OCTO.classById(p.classId);
    var s = cls.skin;
    var seg = quality.bodySegs || 12;
    var ring = Math.max(5, (quality.bodyRings || 8) - 2);

    var onLine = p.state === 'line';
    var airborne = p.state === 'air';
    var ragdoll = p.state === 'ragdoll';
    var climbing = p.state === 'climb';

    // ---- gait ----------------------------------------------------------
    var speed = p.speed || 0;
    var moving = speed > 0.35 && !airborne && !ragdoll;
    var stride = clamp(speed / (cls.stats.walkSpeed || 6), 0, 1.6);
    var ph = p.walkPhase || 0;

    var swing = moving ? Math.sin(ph) * (0.42 + stride * 0.30) : 0;
    var swingB = moving ? Math.sin(ph + Math.PI) * (0.42 + stride * 0.30) : 0;
    // knees only bend on the recovery half of the cycle
    var kneeA = moving ? Math.max(0, -Math.cos(ph)) * (0.55 + stride * 0.45) : 0.06;
    var kneeB = moving ? Math.max(0, -Math.cos(ph + Math.PI)) * (0.55 + stride * 0.45) : 0.06;
    var bob = moving ? Math.abs(Math.sin(ph)) * 0.045 * (0.5 + stride) : 0;

    if (airborne) {
      // tuck: legs forward, arms up
      swing = 0.55; swingB = -0.25; kneeA = 0.9; kneeB = 0.5;
    } else if (onLine) {
      // narrow stance, arms out for balance — the pose that sells the mechanic
      swing = 0.10; swingB = -0.10; kneeA = 0.22; kneeB = 0.22;
    } else if (ragdoll) {
      swing = 0.9; swingB = -0.7; kneeA = 1.2; kneeB = 0.9;
    }

    var squash = p.squash === undefined ? 1 : p.squash;
    var hipY = p.pos.y + P.hip * squash + bob;

    mb.identity();
    mb.translate(p.pos.x, hipY, p.pos.z);
    mb.rotateY(p.visualYaw);
    if (ragdoll) mb.rotateX(1.35);
    else {
      mb.rotateX(p.bodyTilt.z * 0.8 + (onLine ? 0 : stride * 0.10));
      mb.rotateZ(-p.bodyTilt.x * 0.8);
    }
    if (onLine) {
      // lean into the wobble; this is the readout the player feels
      mb.rotateZ(-(p.tilt || 0) * 0.55);
    }
    if (climbing) mb.rotateX(-0.5);

    /* ---- legs ---- */
    for (var side = -1; side <= 1; side += 2) {
      var hipSwing = side < 0 ? swing : swingB;
      var knee = side < 0 ? kneeA : kneeB;
      mb.push();
      mb.translate(side * P.hipHalf, 0, 0);
      mb.rotateX(hipSwing);
      // thigh
      mb.mat({ cell: CELL.NONE, color: s.cloth, roughness: 0.88, emissive: 0 });
      limb(mb, 0.105, 0.092, P.thigh, seg);
      mb.translate(0, -P.thigh, 0);
      mb.rotateX(knee);
      // shin
      mb.mat({ color: mul(s.cloth, 0.86) });
      limb(mb, 0.090, 0.070, P.shin, seg);
      mb.translate(0, -P.shin, 0);
      // boot
      mb.mat({ color: s.metal, roughness: 0.6 });
      mb.push().rotateX(-hipSwing * 0.5 - knee)
        .translate(0, -0.045, P.footLen * 0.18).box(0.135, 0.09, P.footLen).pop();
      mb.pop();
    }

    /* ---- torso ---- */
    mb.push();
    mb.translate(0, 0.02, 0);
    mb.rotateY(moving ? Math.sin(ph) * 0.10 : 0);
    mb.mat({ cell: CELL.NONE, color: s.cloth, roughness: 0.85, emissive: 0 });
    // pelvis
    mb.push().translate(0, 0.06, 0).box(0.30, 0.16, 0.20).pop();
    // ribcage, tapered
    mb.push().translate(0, 0.06 + P.torso * 0.5, 0)
      .box(0.34, P.torso, 0.22).pop();
    // sash / belt — the traditional read
    mb.mat({ color: s.trim, roughness: 0.7 });
    mb.push().translate(0, 0.14, 0).box(0.36, 0.09, 0.24).pop();
    mb.push().translate(0.10, 0.06, 0.12).rotateZ(0.5).box(0.07, 0.34, 0.03).pop();

    var shoulderY = 0.06 + P.torso;

    /* ---- head ---- */
    mb.push();
    mb.translate(0, shoulderY + P.neck, 0);
    mb.mat({ color: mul(s.skinTone, 0.94), roughness: 0.7 });
    mb.push().translate(0, 0.02, 0).cylinder(0.055, 0.06, 0.10, 8).pop();
    mb.mat({ color: s.skinTone, roughness: 0.62 });
    mb.push().translate(0, P.headR * 0.92, 0.008).sphere(P.headR, seg, ring, { yScale: 1.12 }).pop();
    // eyes, kept simple and readable
    mb.mat({ color: [0.06, 0.05, 0.06], roughness: 0.2 });
    for (var e = -1; e <= 1; e += 2) {
      mb.push().translate(e * 0.058, P.headR * 0.98, P.headR * 0.80).box(0.030, 0.036, 0.02).pop();
    }
    buildHeadgear(mb, cls, s, seg, ring);
    mb.pop();

    /* ---- arms ---- */
    for (var a = -1; a <= 1; a += 2) {
      var armSwing = a < 0 ? swingB : swing;   // opposite the leg on the same side
      mb.push();
      mb.translate(a * P.shoulder, shoulderY - 0.03, 0);
      // shoulder pad
      mb.mat({ color: a > 0 && cls.gear === 'shield' ? s.metal : s.cloth, roughness: 0.8 });
      mb.push().sphere(0.085, 8, 6).pop();

      if (onLine) {
        // arms out wide — the universal "I am balancing" silhouette
        mb.rotateZ(a * 1.15);
        mb.rotateX(-0.12 + (p.tilt || 0) * a * 0.5);
      } else if (airborne) {
        mb.rotateZ(a * 0.55); mb.rotateX(-0.7);
      } else if (climbing) {
        mb.rotateX(-1.9); mb.rotateZ(a * 0.25);
      } else {
        mb.rotateX(-armSwing * 0.85);
        mb.rotateZ(a * 0.14);
      }
      mb.mat({ color: mul(s.cloth, 0.95), roughness: 0.86 });
      limb(mb, 0.078, 0.066, P.upperArm, seg);
      mb.translate(0, -P.upperArm, 0);
      mb.rotateX(onLine ? 0.15 : Math.max(0, armSwing) * 0.5 + 0.12);
      mb.mat({ color: s.skinTone, roughness: 0.65 });
      limb(mb, 0.062, 0.052, P.foreArm, seg);
      mb.translate(0, -P.foreArm, 0);
      // hand
      mb.push().translate(0, -0.035, 0).sphere(0.055, 7, 5, { yScale: 1.15 }).pop();
      // gear goes in a hand, so it inherits the arm's pose for free
      if (a > 0) buildMainHand(mb, cls, s, seg);
      else buildOffHand(mb, cls, s, seg);
      mb.pop();
    }

    buildBackGear(mb, cls, s, shoulderY, seg);
    mb.pop();   // torso
    mb.identity();
  }

  /** A tapered limb segment hanging downward from the current origin. */
  function limb(mb, rTop, rBottom, len, seg) {
    mb.push().translate(0, -len * 0.5, 0)
      .cylinder(rBottom, rTop, len, Math.max(6, (seg / 2) | 0)).pop();
  }

  function mul(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

  /* --------------------------------------------------------- headgear */

  function buildHeadgear(mb, cls, s, seg, ring) {
    var g = cls.gear;
    if (g === 'bow') {
      // hood, pushed back off the face
      mb.mat({ color: mul(s.cloth, 1.05), roughness: 0.9 });
      mb.push().translate(0, 0.175, -0.035).sphere(0.175, seg, ring, { yScale: 0.86 }).pop();
      mb.push().translate(0, 0.085, -0.16).rotateX(0.5).box(0.22, 0.20, 0.06).pop();
    } else if (g === 'sword') {
      // headband with a metal plate
      mb.mat({ color: s.trim, roughness: 0.55 });
      mb.push().translate(0, 0.20, 0).cylinder(0.165, 0.165, 0.05, 12, { capTop: false, capBottom: false }).pop();
      mb.mat({ color: s.metal, roughness: 0.3 });
      mb.push().translate(0, 0.21, 0.145).box(0.09, 0.055, 0.02).pop();
    } else if (g === 'shield') {
      // full helm with a nasal bar
      mb.mat({ color: s.metal, roughness: 0.34 });
      mb.push().translate(0, 0.17, 0).sphere(0.185, seg, ring, { yScale: 1.05, vEnd: 0.62 }).pop();
      mb.push().translate(0, 0.17, 0).cylinder(0.185, 0.185, 0.06, 12, { capTop: false, capBottom: false }).pop();
      mb.push().translate(0, 0.13, 0.165).box(0.035, 0.14, 0.03).pop();
      mb.mat({ color: s.trim, roughness: 0.4 });
      mb.push().translate(0, 0.30, -0.02).rotateX(-0.2).box(0.05, 0.16, 0.16).pop();
    } else if (g === 'staff') {
      // ghutra: cloth over the head, cord around it
      mb.mat({ color: mul(s.cloth, 1.02), roughness: 0.95 });
      mb.push().translate(0, 0.165, -0.01).sphere(0.185, seg, ring, { yScale: 0.80 }).pop();
      mb.push().translate(0, 0.02, -0.13).rotateX(0.32).box(0.30, 0.30, 0.05).pop();
      mb.mat({ color: [0.12, 0.12, 0.14], roughness: 0.6 });
      mb.push().translate(0, 0.235, 0).cylinder(0.175, 0.175, 0.035, 12, { capTop: false, capBottom: false }).pop();
    } else if (g === 'orb') {
      // tall pointed hood
      mb.mat({ color: mul(s.cloth, 1.08), roughness: 0.9 });
      mb.push().translate(0, 0.17, -0.02).sphere(0.18, seg, ring, { yScale: 0.9 }).pop();
      mb.push().translate(0, 0.30, -0.05).rotateX(0.35).cylinder(0.13, 0.012, 0.30, 9).pop();
      mb.mat({ color: s.trim, roughness: 0.2, emissive: 0.9 });
      mb.push().translate(0, 0.44, -0.14).sphere(0.036, 7, 5).pop();
    }
  }

  /* ------------------------------------------------------- hand gear */

  function buildMainHand(mb, cls, s, seg) {
    var g = cls.gear;
    if (g === 'sword') {
      mb.mat({ color: s.metal, roughness: 0.22 });
      mb.push().translate(0, -0.10, 0.02).rotateX(1.35);
      mb.push().translate(0, 0.30, 0).box(0.055, 0.62, 0.016).pop();     // blade
      mb.push().translate(0, 0.62, 0).rotateZ(0.78).box(0.045, 0.045, 0.02).pop(); // tip
      mb.mat({ color: s.trim, roughness: 0.45 });
      mb.push().translate(0, 0.02, 0).box(0.17, 0.035, 0.03).pop();      // guard
      mb.push().translate(0, -0.09, 0).cylinder(0.024, 0.028, 0.16, 7).pop(); // grip
      mb.pop();
    } else if (g === 'staff') {
      mb.mat({ color: mul(s.metal, 0.75), roughness: 0.8 });
      mb.push().translate(0, -0.02, 0.02).rotateX(0.12);
      mb.push().translate(0, 0.34, 0).cylinder(0.022, 0.026, 1.30, 7).pop();
      mb.mat({ color: s.trim, roughness: 0.12, emissive: 1.6 });
      mb.push().translate(0, 1.00, 0).sphere(0.085, 10, 8).pop();
      mb.mat({ color: s.metal, roughness: 0.3, emissive: 0 });
      mb.push().translate(0, 0.90, 0).cylinder(0.05, 0.03, 0.09, 8).pop();
      mb.pop();
    } else if (g === 'orb') {
      // no weapon held: light orbs orbit the hand
      mb.mat({ color: s.trim, roughness: 0.1, emissive: 2.2 });
      for (var i = 0; i < 3; i++) {
        var a = (i / 3) * TAU;
        mb.push().translate(Math.cos(a) * 0.13, -0.10 + Math.sin(a) * 0.05, Math.sin(a) * 0.13)
          .sphere(0.038, 7, 5).pop();
      }
    } else if (g === 'bow') {
      mb.mat({ color: mul(s.metal, 0.8), roughness: 0.7 });
      mb.push().translate(0, -0.06, 0.04).rotateX(1.57);
      // recurve limbs
      mb.push().translate(0, 0.26, 0).rotateZ(0.20).cylinder(0.016, 0.010, 0.50, 6).pop();
      mb.push().translate(0, -0.26, 0).rotateZ(-0.20).cylinder(0.010, 0.016, 0.50, 6).pop();
      mb.push().cylinder(0.020, 0.020, 0.14, 7).pop();
      mb.mat({ color: [0.90, 0.88, 0.80], roughness: 0.9 });
      mb.push().translate(0, 0, -0.055).box(0.006, 0.98, 0.006).pop();   // string
      mb.pop();
    }
  }

  function buildOffHand(mb, cls, s, seg) {
    if (cls.gear !== 'shield') return;
    mb.mat({ color: s.metal, roughness: 0.34 });
    mb.push().translate(0, -0.12, 0.10).rotateX(1.57);
    mb.push().cylinder(0.30, 0.26, 0.05, 8).pop();
    mb.mat({ color: s.cloth, roughness: 0.7 });
    mb.push().translate(0, 0.032, 0).cylinder(0.22, 0.19, 0.02, 8).pop();
    mb.mat({ color: s.trim, roughness: 0.4 });
    mb.push().translate(0, 0.05, 0).sphere(0.065, 8, 6, { yScale: 0.7 }).pop();
    mb.pop();
  }

  /* -------------------------------------------------------- back gear */

  function buildBackGear(mb, cls, s, shoulderY, seg) {
    var g = cls.gear;
    if (g === 'bow') {
      // quiver, angled across the back
      mb.mat({ color: mul(s.metal, 0.7), roughness: 0.8 });
      mb.push().translate(-0.11, shoulderY - 0.18, -0.15).rotateX(-0.35).rotateZ(0.30);
      mb.push().cylinder(0.062, 0.070, 0.42, 8).pop();
      mb.mat({ color: [0.86, 0.84, 0.76], roughness: 0.9 });
      for (var i = 0; i < 4; i++) {
        mb.push().translate((i - 1.5) * 0.022, 0.26, 0.012).cylinder(0.007, 0.007, 0.16, 4).pop();
      }
      mb.pop();
    } else if (g === 'orb' || g === 'staff') {
      // long robe skirt so the legs read as robed, not bare
      mb.mat({ color: mul(s.cloth, g === 'orb' ? 1.0 : 1.04), roughness: 0.92 });
      mb.push().translate(0, -0.30, 0).cylinder(0.34, 0.20, 0.62, 12, { capTop: false, capBottom: false }).pop();
      if (g === 'orb') {
        mb.mat({ color: s.trim, roughness: 0.3, emissive: 0.7 });
        mb.push().translate(0, -0.60, 0).cylinder(0.345, 0.345, 0.035, 12, { capTop: false, capBottom: false }).pop();
      }
    } else if (g === 'shield') {
      // back plate + cloak
      mb.mat({ color: s.metal, roughness: 0.35 });
      mb.push().translate(0, shoulderY - 0.24, -0.13).box(0.32, 0.36, 0.05).pop();
      mb.mat({ color: mul(s.cloth, 0.9), roughness: 0.92 });
      mb.push().translate(0, shoulderY - 0.44, -0.16).rotateX(0.06).box(0.38, 0.66, 0.03).pop();
    }
  }

  OCTO.avatar = OCTO.avatar || {};
  OCTO.avatar.buildHuman = buildHuman;
  OCTO.avatar.PROPORTIONS = P;

})(typeof window !== 'undefined' ? window : globalThis);
