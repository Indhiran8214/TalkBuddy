// Smooth scroll behavior for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Speech synthesis setup
const speech = new SpeechSynthesisUtterance();
let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  const voiceSelect = document.getElementById("voiceSelect");
  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    if (voice.lang.startsWith("en")) {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    }
  });

  if (voices.length > 0) {
    speech.voice = voices[0];
  }
}

// Ensure voices are loaded
if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

// Text-to-Speech Function
function speak() {
  const textInput = document.querySelector("textarea");
  const textToSpeak = textInput.value.trim();
  const selectedVoiceIndex = document.getElementById("voiceSelect").value;

  if (textToSpeak !== "") {
    speech.text = textToSpeak;
    speech.voice = voices[selectedVoiceIndex];
    speech.rate = 1.0;
    speech.volume = 1.0;
    speech.pitch = 1.1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  } else {
    alert("Please enter text to speak.");
  }
}

// Speech-to-Text Function
function speak_type() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.interimResults = true;
  recognition.continuous = false;

  const textArea = document.querySelector("textarea");
  let finalTranscript = "";

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    textArea.value = finalTranscript + interimTranscript;
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    alert("Speech recognition failed. Please try again.");
  };

  recognition.start();
}

// Save Note to Local Storage
function note_save() {
  const text = document.querySelector("textarea").value.trim();
  if (!text) {
    alert("Nothing to save!");
    return;
  }

  let notes = JSON.parse(localStorage.getItem("speechNotes")) || [];
  notes.push(text);
  localStorage.setItem("speechNotes", JSON.stringify(notes));

  alert("Note saved!");
  document.querySelector("textarea").value = "";
}
