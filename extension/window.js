const statusText = document.getElementById("statusText");
const toggleListenButton = document.getElementById("toggleListen");
const transcriptEl = document.getElementById("transcript");
const answerEl = document.getElementById("answer");
const settingsButton = document.getElementById("settingsButton");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

function setStatus(message) {
  statusText.textContent = message;
}

function setListeningState(listening) {
  isListening = listening;
  toggleListenButton.textContent = listening ? "Stop Listening" : "Start Listening";
  toggleListenButton.classList.toggle("listening", listening);
  setStatus(listening ? "Listening..." : "Idle");
}

async function getApiKey() {
  const result = await chrome.storage.sync.get("openaiApiKey");
  return result.openaiApiKey || "";
}

async function requestAnswer(prompt) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    answerEl.textContent = "Add your OpenAI API key in Settings to enable answers.";
    setStatus("Missing API key");
    return;
  }

  setStatus("Thinking...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a discreet interview assistant. Provide concise, spoken-ready answers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    answerEl.textContent = `API error: ${response.status} ${errorText}`;
    setStatus("Error");
    return;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  answerEl.textContent = content || "No response received.";
  setStatus("Answer ready");
}

function setupRecognition() {
  if (!SpeechRecognition) {
    answerEl.textContent = "Speech recognition is not supported in this browser.";
    toggleListenButton.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0].transcript)
      .join(" ")
      .trim();

    transcriptEl.textContent = transcript || "Listening...";

    const isFinal = event.results[event.results.length - 1].isFinal;
    if (isFinal && transcript) {
      requestAnswer(transcript);
    }
  };

  recognition.onstart = () => setListeningState(true);
  recognition.onend = () => setListeningState(false);
  recognition.onerror = (event) => {
    setStatus(`Error: ${event.error}`);
    setListeningState(false);
  };
}

function toggleListening() {
  if (!recognition) {
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    transcriptEl.textContent = "Listening...";
    answerEl.textContent = "Waiting for a question...";
    recognition.start();
  }
}

settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

toggleListenButton.addEventListener("click", toggleListening);

setupRecognition();
