/* =====================================================================
 * OCTOPUSES ON THE LINE — 55-classes.js
 *
 * The five Line-Walker disciplines.
 *
 * Every class crosses the same ropes, so each one is defined by HOW IT
 * CHANGES THE LINE rather than by a damage type. Weight, balance
 * control and traversal speed feed straight into the inverted-pendulum
 * model the game already runs — a Tank genuinely plays differently on a
 * rope than an Archer, using systems that already exist.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  var CLASSES = [
    {
      id: 'sayyad', en: 'Archer', ar: 'الصيّاد',
      roleEn: 'Ranged', roleAr: 'رامٍ',
      lineEn: 'Fires a grapple line across any gap.',
      lineAr: 'يطلق خطاف حبل ليعبر أي فجوة.',
      loreEn: 'Scouts the high wires. Sees the route before anyone else does.',
      loreAr: 'يستكشف الأسلاك العالية، ويرى الطريق قبل الجميع.',
      gear: 'bow',
      skin: { cloth: [0.32, 0.46, 0.34], trim: [0.86, 0.72, 0.38], metal: [0.62, 0.58, 0.50], skinTone: [0.76, 0.56, 0.40] },
      stats: {
        walkSpeed: 5.9, sprintSpeed: 9.6, jumpVelocity: 9.6,
        lineWeight: 28, balanceControl: 5.6, lineWalkSpeed: 2.8, lineSprintSpeed: 5.0,
        destabilise: 0.95
      },
      bars: { speed: 4, balance: 4, power: 3, support: 1 }
    },
    {
      id: 'muqatil', en: 'Fighter', ar: 'المقاتل',
      roleEn: 'Melee', roleAr: 'مقاتل',
      lineEn: 'Runs a line at full speed without losing footing.',
      lineAr: 'يركض على الخيط بأقصى سرعة دون أن يفقد اتزانه.',
      loreEn: 'First across, every time. Balance is muscle memory.',
      loreAr: 'أول من يعبر دائماً. التوازن عنده عادة لا مهارة.',
      gear: 'sword',
      skin: { cloth: [0.58, 0.22, 0.20], trim: [0.90, 0.78, 0.44], metal: [0.70, 0.68, 0.62], skinTone: [0.70, 0.48, 0.34] },
      stats: {
        walkSpeed: 6.4, sprintSpeed: 10.4, jumpVelocity: 9.8,
        lineWeight: 34, balanceControl: 6.4, lineWalkSpeed: 3.4, lineSprintSpeed: 6.0,
        destabilise: 0.80
      },
      bars: { speed: 5, balance: 5, power: 4, support: 1 }
    },
    {
      id: 'dir', en: 'Tank', ar: 'الدِّرع',
      roleEn: 'Frontline', roleAr: 'خط أمامي',
      lineEn: 'Heaviest — sags the rope into a bridge for allies.',
      lineAr: 'الأثقل — يُحني الخيط ليصير جسراً للرفاق.',
      loreEn: 'Holds the anchor while everyone else crosses.',
      loreAr: 'يثبت المرساة بينما يعبر الباقون.',
      gear: 'shield',
      skin: { cloth: [0.30, 0.34, 0.44], trim: [0.72, 0.74, 0.80], metal: [0.78, 0.80, 0.86], skinTone: [0.66, 0.46, 0.32] },
      stats: {
        walkSpeed: 4.6, sprintSpeed: 7.2, jumpVelocity: 8.6,
        lineWeight: 62, balanceControl: 4.2, lineWalkSpeed: 1.9, lineSprintSpeed: 3.2,
        destabilise: 1.30
      },
      bars: { speed: 2, balance: 2, power: 5, support: 3 }
    },
    {
      id: 'shafi', en: 'Healer', ar: 'الشافي',
      roleEn: 'Support', roleAr: 'مساند',
      lineEn: 'Steadies an ally’s balance from a distance.',
      lineAr: 'يثبّت توازن رفيقه عن بُعد.',
      loreEn: 'The only one who can catch a falling Line-Walker.',
      loreAr: 'الوحيد الذي يستطيع إنقاذ ماشي خيط يسقط.',
      gear: 'staff',
      skin: { cloth: [0.90, 0.88, 0.82], trim: [0.36, 0.70, 0.66], metal: [0.84, 0.76, 0.52], skinTone: [0.80, 0.60, 0.44] },
      stats: {
        walkSpeed: 5.4, sprintSpeed: 8.6, jumpVelocity: 9.2,
        lineWeight: 30, balanceControl: 5.8, lineWalkSpeed: 2.6, lineSprintSpeed: 4.4,
        destabilise: 0.88
      },
      bars: { speed: 3, balance: 4, power: 2, support: 5 }
    },
    {
      id: 'sahir', en: 'Mage', ar: 'الساحر',
      roleEn: 'Control', roleAr: 'تحكم',
      lineEn: 'Conjures a new line from light where none exists.',
      lineAr: 'يخلق خيطاً من نور حيث لا خيط.',
      loreEn: 'Does not follow the road. Writes one.',
      loreAr: 'لا يسلك الطريق، بل يكتبه.',
      gear: 'orb',
      skin: { cloth: [0.34, 0.26, 0.52], trim: [0.52, 0.86, 0.94], metal: [0.62, 0.56, 0.74], skinTone: [0.74, 0.54, 0.40] },
      stats: {
        walkSpeed: 5.2, sprintSpeed: 8.2, jumpVelocity: 9.0,
        lineWeight: 26, balanceControl: 5.0, lineWalkSpeed: 2.4, lineSprintSpeed: 4.0,
        destabilise: 1.00
      },
      bars: { speed: 3, balance: 3, power: 5, support: 2 }
    }
  ];

  function byId(id) {
    for (var i = 0; i < CLASSES.length; i++) if (CLASSES[i].id === id) return CLASSES[i];
    return CLASSES[1]; // Fighter is the safe default
  }

  OCTO.CLASSES = CLASSES;
  OCTO.classById = byId;

})(typeof window !== 'undefined' ? window : globalThis);
