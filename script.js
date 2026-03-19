/* ─── TalkBuddy Script ─────────────────────────── */

// ── Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});

// ── Active nav link on scroll
const sections = document.querySelectorAll(".page-section");
const navLinks = document.querySelectorAll(".nav-link");
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(l => l.classList.remove("active"));
      const id = entry.target.getAttribute("id");
      const match = document.querySelector(`.nav-link[href="#${id}"]`);
      if (match) match.classList.add("active");
    }
  });
}, { threshold: 0.45 });
sections.forEach(s => observer.observe(s));

// ── Hamburger menu
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.querySelector(".nav-links").classList.toggle("open");
});

// ── Char counter
function updateCharCount() {
  const val = document.getElementById("mainTextarea").value;
  document.getElementById("charCount").textContent = `${val.length} character${val.length !== 1 ? "s" : ""}`;
}

// ── Rate / pitch display
function updateRate(val) {
  document.getElementById("rateVal").textContent = parseFloat(val).toFixed(1) + "×";
}
function updatePitch(val) {
  document.getElementById("pitchVal").textContent = parseFloat(val).toFixed(1);
}

// ── Toast notification
function showToast(msg, type = "") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ── Status indicator
function setStatus(label, mode = "") {
  const dot  = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  dot.className  = "status-dot" + (mode ? " active-" + mode : "");
  text.textContent = label;
}

// ─────────────────────────────────────────────────
// ── Speech Synthesis (TTS)
// ─────────────────────────────────────────────────
const speech = new SpeechSynthesisUtterance();
let voices = [];
let isSpeaking = false;

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  const voiceSelect = document.getElementById("voiceSelect");
  const prev = voiceSelect.value;
  voiceSelect.innerHTML = "";

  let idx = 0;
  voices.forEach((voice, i) => {
    if (voice.lang.startsWith("en")) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
      if (i === 0) idx = i;
    }
  });

  if (prev) voiceSelect.value = prev;
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function speak() {
  const textInput  = document.getElementById("mainTextarea");
  const speakBtn   = document.getElementById("speakBtn");
  const textToSpeak = textInput.value.trim();

  if (!textToSpeak) {
    showToast("Please enter some text first.", "error");
    return;
  }

  // If already speaking — stop
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    speakBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      Speak`;
    speakBtn.classList.remove("active");
    setStatus("Ready");
    return;
  }

  const selectedIndex = document.getElementById("voiceSelect").value;
  const rate  = parseFloat(document.getElementById("rateSlider").value);
  const pitch = parseFloat(document.getElementById("pitchSlider").value);

  speech.text   = textToSpeak;
  speech.voice  = voices[selectedIndex] || voices[0];
  speech.rate   = rate;
  speech.pitch  = pitch;
  speech.volume = 1.0;

  speech.onstart = () => {
    isSpeaking = true;
    speakBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      Stop`;
    speakBtn.classList.add("active");
    setStatus("Speaking…", "speak");
  };

  speech.onend = speech.onerror = () => {
    isSpeaking = false;
    speakBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      Speak`;
    speakBtn.classList.remove("active");
    setStatus("Ready");
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speech);
}

// ─────────────────────────────────────────────────
// ── Speech Recognition (STT)
// ─────────────────────────────────────────────────
let recognition = null;
let isListening = false;

function speak_type() {
  const micBtn    = document.getElementById("micBtn");
  const textArea  = document.getElementById("mainTextarea");
  const visualizer = document.getElementById("micVisualizer");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast("Speech Recognition not supported in this browser.", "error");
    return;
  }

  // Stop if already listening
  if (isListening && recognition) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.lang = "en-US";

  const existingText = textArea.value.trimEnd();
  let finalTranscript = existingText ? existingText + " " : "";

  recognition.onstart = () => {
    isListening = true;
    micBtn.textContent = "⏹ Stop";
    micBtn.classList.add("active");
    visualizer.classList.add("active");
    setStatus("Listening…", "mic");
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += t + " ";
      } else {
        interimTranscript += t;
      }
    }
    textArea.value = finalTranscript + interimTranscript;
    updateCharCount();
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    const msg = event.error === "not-allowed"
      ? "Microphone access denied." 
      : `Recognition error: ${event.error}`;
    showToast(msg, "error");
    stopListening();
  };

  recognition.onend = () => {
    // If continuous but ended unexpectedly, clean up
    if (isListening) stopListening();
  };

  recognition.start();
}

function stopListening() {
  isListening = false;
  const micBtn    = document.getElementById("micBtn");
  const visualizer = document.getElementById("micVisualizer");
  micBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
    Speak to Type`;
  micBtn.classList.remove("active");
  visualizer.classList.remove("active");
  setStatus("Ready");
}

// ─────────────────────────────────────────────────
// ── Note Saving & Viewing
// ─────────────────────────────────────────────────
function note_save() {
  const text = document.getElementById("mainTextarea").value.trim();
  if (!text) {
    showToast("Nothing to save!", "error");
    return;
  }

  let notes = JSON.parse(localStorage.getItem("talkbuddyNotes")) || [];
  notes.unshift({ text, time: new Date().toLocaleString() });
  localStorage.setItem("talkbuddyNotes", JSON.stringify(notes));

  showToast("Note saved! ✓", "success");
  setStatus("Saved!", "save");
  setTimeout(() => setStatus("Ready"), 2000);

  document.getElementById("mainTextarea").value = "";
  updateCharCount();
  renderNotes();
}

function renderNotes() {
  const notes = JSON.parse(localStorage.getItem("talkbuddyNotes")) || [];
  const list  = document.getElementById("notesList");
  const badge = document.getElementById("notesBadge");

  badge.textContent = notes.length;

  if (!notes.length) {
    list.innerHTML = `<div class="notes-empty">No notes saved yet. Type something and hit Save!</div>`;
    return;
  }

  list.innerHTML = notes.map((n, i) => `
    <div class="note-item" id="note-${i}">
      <span class="note-text">${escapeHtml(n.text)}</span>
      <span class="note-meta">${n.time || ""}</span>
      <button class="note-delete" onclick="deleteNote(${i})" title="Delete">✕</button>
    </div>
  `).join("");
}

function deleteNote(index) {
  let notes = JSON.parse(localStorage.getItem("talkbuddyNotes")) || [];
  notes.splice(index, 1);
  localStorage.setItem("talkbuddyNotes", JSON.stringify(notes));
  renderNotes();
  showToast("Note deleted.");
}

function clearAllNotes() {
  if (!confirm("Delete all saved notes?")) return;
  localStorage.removeItem("talkbuddyNotes");
  renderNotes();
  showToast("All notes cleared.");
}

function clearText() {
  document.getElementById("mainTextarea").value = "";
  updateCharCount();
  setStatus("Ready");
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Init
document.addEventListener("DOMContentLoaded", () => {
  renderNotes();
  updateCharCount();
});
