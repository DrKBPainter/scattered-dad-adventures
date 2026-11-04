/* ===== SCATTERED DAD ADVENTURES — audio.js =====
   WebAudio SFX: all sounds generated procedurally via the Web Audio API.
   No external files required. AudioContext created lazily on first interaction.
   Sounds: sfxKneeCrack / sfxOof / sfxPickup / sfxCraft / sfxUnlock
   Mute:   sfxToggleMute() — state persisted in localStorage ("sda_mute")
   ============================================= */
"use strict";
let _ac = null;
let SFX_MUTED = (typeof localStorage !== "undefined" && localStorage.getItem("sda_mute") === "1");

function _getAC() {
  if (!_ac) {
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
  }
  if (_ac && _ac.state === "suspended") { try { _ac.resume(); } catch(e) {} }
  return _ac;
}

/* oscillator tone: type, start-freq, end-freq (or null), duration, peak-gain */
function _osc(type, freq, freqEnd, dur, gain) {
  if (SFX_MUTED) return;
  const ac = _getAC(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ac.currentTime + dur);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.start(ac.currentTime); o.stop(ac.currentTime + dur + 0.02);
}

/* short burst of bandpass-filtered white noise */
function _noise(dur, gain, bpFreq) {
  if (SFX_MUTED) return;
  const ac = _getAC(); if (!ac) return;
  const n = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), g = ac.createGain();
  filt.type = "bandpass"; filt.frequency.value = bpFreq || 300; filt.Q.value = 1.2;
  src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  src.start(ac.currentTime); src.stop(ac.currentTime + dur + 0.02);
}

/* ===== PUBLIC SFX API ===== */

/* Knee crack: percussive pop + low thud — the sound of a man betrayed by his own skeleton */
function sfxKneeCrack() {
  _noise(0.05, 0.45, 260);
  _osc("sine", 95, 38, 0.10, 0.13);
}

/* "Oof": descending grunt — the universal language of a dad who just took a hit */
function sfxOof() {
  _osc("sine", 230, 85, 0.18, 0.26);
  _osc("triangle", 155, 65, 0.14, 0.13);
}

/* Pickup chime: quick ascending blip — success, however small */
function sfxPickup() {
  _osc("sine", 660, 990, 0.10, 0.19);
}

/* Craft success: two-tone click — the sound of a man who knows what he is doing (he does not) */
function sfxCraft() {
  if (SFX_MUTED) return;
  _getAC(); // ensure context is live before setTimeout
  _osc("square", 330, 495, 0.07, 0.16);
  setTimeout(function() { _osc("sine", 880, 1320, 0.13, 0.19); }, 75);
}

/* Unlock: mechanical click + rising tone — a door yields to inevitability */
function sfxUnlock() {
  _noise(0.04, 0.32, 420);
  setTimeout(function() { _osc("sine", 440, 660, 0.15, 0.21); }, 45);
}

/* Mute toggle — bound to [U] in input.js */
function sfxToggleMute() {
  SFX_MUTED = !SFX_MUTED;
  if (typeof localStorage !== "undefined") localStorage.setItem("sda_mute", SFX_MUTED ? "1" : "0");
}
