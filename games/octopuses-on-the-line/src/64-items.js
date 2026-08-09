/* =====================================================================
 * OCTOPUSES ON THE LINE — 64-items.js
 *
 * Loot, the pack, and the auction floor.
 *
 * Items exist to feed the two things the game already measures: how you
 * cross a rope, and how hard you hit. Every stat an item carries maps
 * onto a number the simulation is already reading — `lineWeight` and
 * `balanceControl` go straight into the inverted-pendulum model, so a
 * heavy hauberk genuinely makes the crossing harder while it makes the
 * fight easier. Nothing here is a stat that only appears on its own
 * tooltip.
 * ===================================================================== */
(function (root) {
  'use strict';

  var OCTO = root.OCTO;

  /* -------------------------------------------------------- rarities */

  var RARITY = {
    common:    { en: 'Common',    ar: 'عادي',   mult: 1.00, colour: '#cbbfa8', weight: 58 },
    fine:      { en: 'Fine',      ar: 'جيّد',   mult: 1.35, colour: '#79e6a0', weight: 26 },
    rare:      { en: 'Rare',      ar: 'نادر',   mult: 1.85, colour: '#6fc0ff', weight: 12 },
    relic:     { en: 'Relic',     ar: 'أثري',   mult: 2.60, colour: '#c79bff', weight: 3.4 },
    thread:    { en: 'Thread',    ar: 'خيطي',   mult: 3.80, colour: '#ffd24a', weight: 0.6 }
  };
  var RARITY_ORDER = ['common', 'fine', 'rare', 'relic', 'thread'];

  /* ---------------------------------------------------------- bases */

  /**
   * Item bases. `slot` is where it equips; `stats` are per-level-1
   * values scaled by level and rarity when the item is rolled.
   *
   *   atk      — added to the attack the skills scale from
   *   def      — flat damage reduction
   *   hp / sp  — added to the pools
   *   grip     — balance control, straight into the pendulum
   *   weight   — line weight; positive sags the rope more
   */
  var BASES = [
    { id: 'wrap',    slot: 'body',  en: 'Rope Wrap',      ar: 'لفافة الحبل',   stats: { def: 3, grip: 0.35, weight: 2 } },
    { id: 'hauberk', slot: 'body',  en: 'Sand Hauberk',   ar: 'درع الرمل',     stats: { def: 8, hp: 40, weight: 9 } },
    { id: 'silks',   slot: 'body',  en: 'Falak Silks',    ar: 'حرير فلك',      stats: { def: 4, sp: 26, grip: 0.5, weight: -2 } },
    { id: 'blade',   slot: 'hand',  en: 'Curved Blade',   ar: 'نصل معقوف',     stats: { atk: 9 } },
    { id: 'bow',     slot: 'hand',  en: 'Horn Bow',       ar: 'قوس القرن',     stats: { atk: 7, grip: 0.3 } },
    { id: 'stave',   slot: 'hand',  en: 'Reed Stave',     ar: 'عصا القصب',     stats: { atk: 5, sp: 22 } },
    { id: 'buckler', slot: 'hand',  en: 'Anchor Buckler', ar: 'ترس المرساة',   stats: { atk: 3, def: 7, weight: 5 } },
    { id: 'slippers',slot: 'feet',  en: 'Souq Slippers',  ar: 'خف السوق',      stats: { grip: 0.8, weight: -3 } },
    { id: 'boots',   slot: 'feet',  en: 'Harbour Boots',  ar: 'حذاء الميناء',  stats: { def: 4, grip: 0.4, hp: 18 } },
    { id: 'charm',   slot: 'charm', en: 'Pearl Charm',    ar: 'تعويذة اللؤلؤ', stats: { sp: 18, grip: 0.25 } },
    { id: 'sigil',   slot: 'charm', en: 'Thread Sigil',   ar: 'ختم الخيط',     stats: { atk: 4, sp: 14 } }
  ];

  var SLOTS = [
    { id: 'hand',  en: 'Hand',  ar: 'اليد' },
    { id: 'body',  en: 'Body',  ar: 'الجسد' },
    { id: 'feet',  en: 'Feet',  ar: 'القدم' },
    { id: 'charm', en: 'Charm', ar: 'التعويذة' }
  ];

  function baseById(id) {
    for (var i = 0; i < BASES.length; i++) if (BASES[i].id === id) return BASES[i];
    return BASES[0];
  }

  /** Weighted rarity roll, nudged upward by the source's level. */
  function rollRarity(level, luck) {
    var total = 0, i;
    var w = {};
    for (i = 0; i < RARITY_ORDER.length; i++) {
      var k = RARITY_ORDER[i];
      // higher tiers get commoner with level, so late loot feels different
      w[k] = RARITY[k].weight * (1 + (i > 0 ? level * 0.018 * i : 0)) * (1 + (luck || 0));
      total += w[k];
    }
    var r = Math.random() * total;
    for (i = 0; i < RARITY_ORDER.length; i++) {
      r -= w[RARITY_ORDER[i]];
      if (r <= 0) return RARITY_ORDER[i];
    }
    return 'common';
  }

  var nextUid = 1;

  /** Roll a concrete item from a base at a level. */
  function makeItem(baseId, level, rarity) {
    var base = baseById(baseId);
    rarity = rarity || 'common';
    var mult = RARITY[rarity].mult;
    var lv = Math.max(1, level | 0);
    var stats = {};
    for (var k in base.stats) {
      var v = base.stats[k];
      if (k === 'grip' || k === 'weight') {
        stats[k] = Math.round(v * mult * 100) / 100;          // flat-ish
      } else {
        stats[k] = Math.round(v * mult * (1 + (lv - 1) * 0.16));
      }
    }
    var worth = 24 + lv * 9;
    for (var s in stats) worth += Math.abs(stats[s]) * (s === 'hp' ? 0.6 : 3);
    return {
      uid: nextUid++,
      base: base.id, slot: base.slot, level: lv, rarity: rarity,
      en: base.en, ar: base.ar, stats: stats,
      value: Math.round(worth * mult)
    };
  }

  /** What a foe drops. Elites always give something. */
  function rollDrop(foe) {
    var chance = foe.def.elite ? 1 : 0.34;
    if (Math.random() > chance) return null;
    var pool = BASES[Math.floor(Math.random() * BASES.length)];
    var rarity = rollRarity(foe.level, foe.def.elite ? 0.9 : 0);
    return makeItem(pool.id, foe.level, rarity);
  }

  /* ------------------------------------------------------------ pack */

  function Inventory(state) {
    state = state || {};
    this.capacity = 40;
    this.items = (state.items || []).slice();
    this.equipped = state.equipped ? JSON.parse(JSON.stringify(state.equipped)) : {};
    var maxUid = 0;
    this.items.concat(this.equippedList()).forEach(function (it) {
      if (it && it.uid > maxUid) maxUid = it.uid;
    });
    if (maxUid >= nextUid) nextUid = maxUid + 1;
  }

  Inventory.prototype.equippedList = function () {
    var out = [];
    for (var k in this.equipped) if (this.equipped[k]) out.push(this.equipped[k]);
    return out;
  };

  Inventory.prototype.full = function () { return this.items.length >= this.capacity; };

  Inventory.prototype.add = function (item) {
    if (!item || this.full()) return false;
    this.items.push(item);
    return true;
  };

  Inventory.prototype.remove = function (uid) {
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].uid === uid) return this.items.splice(i, 1)[0];
    }
    return null;
  };

  Inventory.prototype.byUid = function (uid) {
    for (var i = 0; i < this.items.length; i++) if (this.items[i].uid === uid) return this.items[i];
    return null;
  };

  /** Equip from the pack; whatever was in the slot goes back to the pack. */
  Inventory.prototype.equip = function (uid) {
    var item = this.remove(uid);
    if (!item) return null;
    var old = this.equipped[item.slot] || null;
    this.equipped[item.slot] = item;
    if (old) this.items.push(old);
    return item;
  };

  Inventory.prototype.unequip = function (slot) {
    var item = this.equipped[slot];
    if (!item) return null;
    if (this.full()) return null;
    this.equipped[slot] = null;
    this.items.push(item);
    return item;
  };

  /** Summed stats from everything worn. */
  Inventory.prototype.bonuses = function () {
    var out = { atk: 0, def: 0, hp: 0, sp: 0, grip: 0, weight: 0 };
    var worn = this.equippedList();
    for (var i = 0; i < worn.length; i++) {
      for (var k in worn[i].stats) {
        if (out[k] === undefined) out[k] = 0;
        out[k] += worn[i].stats[k];
      }
    }
    return out;
  };

  Inventory.prototype.toJSON = function () {
    return { items: this.items, equipped: this.equipped };
  };

  /* --------------------------------------------------------- auction */

  var SELLER_NAMES = [
    { en: 'Umm Layla', ar: 'أم ليلى' }, { en: 'Faris', ar: 'فارس' },
    { en: 'Hadi', ar: 'هادي' }, { en: 'Nura', ar: 'نورة' },
    { en: 'Zayd', ar: 'زيد' }, { en: 'The old diver', ar: 'الغوّاص العجوز' },
    { en: 'A masked walker', ar: 'ماشٍ مقنّع' }, { en: 'Eleanor', ar: 'إلينور' }
  ];

  /**
   * The auction floor. There is no server, so the other bidders are the
   * city itself: listings are generated from a seeded roll and refresh on
   * a timer. Selling is real — the item leaves your pack and the dirhams
   * arrive when it clears.
   */
  function Auction(state) {
    state = state || {};
    this.listings = state.listings || [];
    this.mine = state.mine || [];
    this.refreshAt = state.refreshAt || 0;
    this.seed = state.seed || 1;
  }

  /** Regenerate the floor around the player's level. */
  Auction.prototype.refresh = function (level, now) {
    this.listings = [];
    var n = 8 + Math.floor(Math.random() * 5);
    for (var i = 0; i < n; i++) {
      var lv = Math.max(1, level + Math.round((Math.random() - 0.35) * 8));
      var base = BASES[Math.floor(Math.random() * BASES.length)];
      var item = makeItem(base.id, lv, rollRarity(lv, 0.25));
      var who = SELLER_NAMES[Math.floor(Math.random() * SELLER_NAMES.length)];
      this.listings.push({
        item: item,
        price: Math.round(item.value * (1.1 + Math.random() * 0.9)),
        sellerEn: who.en, sellerAr: who.ar
      });
    }
    this.refreshAt = now + 180;      // three minutes of game time
    return this.listings.length;
  };

  Auction.prototype.tick = function (level, now) {
    if (now >= this.refreshAt) this.refresh(level, now);
    // resolve the player's own listings
    for (var i = this.mine.length - 1; i >= 0; i--) {
      var l = this.mine[i];
      if (now >= l.clearsAt) {
        l.sold = true;
      }
    }
  };

  /**
   * List an item. Price it above about 1.6× its worth and the city takes
   * longer to bite; price it low and it clears fast. A 5% floor fee comes
   * off the top, which is what stops listing being free money.
   */
  Auction.prototype.list = function (item, price, now) {
    var ratio = price / Math.max(1, item.value);
    var wait = 20 + Math.max(0, ratio - 0.8) * 110;
    var l = {
      item: item, price: Math.round(price),
      fee: Math.max(1, Math.round(price * 0.05)),
      listedAt: now, clearsAt: now + wait, sold: false, collected: false
    };
    this.mine.push(l);
    return l;
  };

  Auction.prototype.collect = function (index) {
    var l = this.mine[index];
    if (!l || !l.sold || l.collected) return 0;
    l.collected = true;
    this.mine.splice(index, 1);
    return l.price - l.fee;
  };

  Auction.prototype.toJSON = function () {
    return { listings: this.listings, mine: this.mine, refreshAt: this.refreshAt };
  };

  OCTO.items = {
    RARITY: RARITY,
    RARITY_ORDER: RARITY_ORDER,
    BASES: BASES,
    SLOTS: SLOTS,
    Inventory: Inventory,
    Auction: Auction,
    makeItem: makeItem,
    rollDrop: rollDrop,
    rollRarity: rollRarity,
    baseById: baseById
  };

})(typeof window !== 'undefined' ? window : globalThis);
