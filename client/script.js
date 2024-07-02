import bot from './assets/logo_dark.svg';
import copy from './assets/copy.svg';
import micIconSrc from './assets/mic.svg';
import micSquareIconSrc from './assets/mic-square.svg';
import sendIconSrc from './assets/send.svg';
import { marked } from 'marked';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const textarea = document.getElementById('textbox');
const originalHeight = '41.6px';
const forgetButton = document.getElementById('forget');
const sendButton = document.querySelector('form button');
const micIcon = document.querySelector('form button img');

let loadInterval;
let isListening = false;
let recognition;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function startSpeechRecognition() {
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isListening = true;
      micIcon.src = micSquareIconSrc;
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      textarea.value = finalTranscript + interimTranscript;
      textarea.dispatchEvent(new Event('input'));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      showToast(`Speech recognition error: ${event.error}`, 'error');
      stopSpeechRecognition();
    };

    recognition.onend = () => {
      if (isListening) {
        startSpeechRecognition();
      }
    };

    recognition.start();
  } else {
    console.error('Speech recognition is not supported in this browser.');
    showToast('Speech recognition is not supported in this browser.', 'error');
  }
}

function stopSpeechRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
    isListening = false;
    micIcon.src = micIconSrc;
  }
}

function showToast(message, type) {
  Toastify({
    text: message,
    duration: 3000,
    className: type,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    style: {
      background: '#101010',
      boxShadow: '0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px #CC1E4A50',
    },
  }).showToast();
}

sendButton.addEventListener('click', (e) => {
  e.preventDefault();
  if (isListening) {
    stopSpeechRecognition();
  } else {
    if (textarea.value.trim() === '') {
      startSpeechRecognition();
    } else {
      handleSubmit(e);
    }
  }
});

// Event listeners for textarea
textarea.addEventListener('input', (e) => {
  if (textarea.value.trim() !== '') {
    micIcon.src = sendIconSrc;
    stopSpeechRecognition();
  } else {
    micIcon.src = micIconSrc;
  }
  autoResize();
});

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
      <div class="chat">
        ${isAi ? `<div class="profile"><img class="profileImg" src="${bot}" alt="bot"/></div>` : ''}
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
  `;
}

async function handleSubmit(e) {
  e.preventDefault();

  const promptData = textarea.value.trim();

  if (!promptData) {
    form.classList.add('shake');
    setTimeout(() => {
      form.classList.remove('shake');
    }, 500);
    return;
  }

  chatContainer.innerHTML += chatStripe(false, promptData);
  form.reset();

  // Change the send button back to the mic button
  micIcon.src = micIconSrc;

  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;
  const messageDiv = document.getElementById(uniqueId);

  const rotatingImage = messageDiv.previousElementSibling.querySelector('.profileImg');
  rotatingImage.classList.add('rotate');
  loader(messageDiv);

  try {
    const response = await fetch('https://sunday-hx52.onrender.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptData,
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    rotatingImage.classList.remove('rotate');

    if (response.ok) {
      const data = await response.json();
      let parsedData = data.bot.trim();

      parsedData = marked(parsedData);
      messageDiv.innerHTML = parsedData;

      const preTags = messageDiv.querySelectorAll('pre');
      preTags.forEach((preTag, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pre-wrapper';
        preTag.parentNode.insertBefore(wrapper, preTag);
        wrapper.appendChild(preTag);

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = `Copy Code <img src="${copy}" alt="copy">`;
        copyButton.dataset.target = `${uniqueId}-pre-${index}`;
        wrapper.appendChild(copyButton);
      });
    } else {
      const err = await response.text();
      messageDiv.innerHTML = 'Something went wrong';
      showToast(err, 'error');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    messageDiv.innerHTML = 'Something went wrong';
    showToast('Failed to fetch response', 'error');
  }
}

form.addEventListener('submit', (e) => {
  textarea.style.height = originalHeight;
  handleSubmit(e);
});
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault();
    textarea.style.height = originalHeight;
    handleSubmit(e);
  }
});

forgetButton.addEventListener('click', async () => {
  try {
    const response = await fetch('https://sunday-hx52.onrender.com/forget', {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      showToast(data.message, 'success');
    } else {
      const error = await response.text();
      console.error('Error clearing memory:', error);
      showToast(`Error clearing memory: ${error}`, 'error');
    }
  } catch (error) {
    console.error('Error fetching forget endpoint:', error);
    showToast(`Error fetching forget endpoint: ${error}`, 'error');
  }
});

textarea.addEventListener('input', autoResize);

function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, 41.6)}px`;
}

document.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'visible') {
    document.getElementById('textbox').focus();
  }
});

window.onload = function() {
  document.getElementById('textbox').focus();
};

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Copied to clipboard!', 'success');
    })
    .catch((err) => {
      console.error('Could not copy text:', err);
      showToast('Failed to copy to clipboard.', 'error');
    });
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('copy-btn')) {
    const preTag = event.target.previousElementSibling;

    if (preTag && preTag.tagName.toLowerCase() === 'pre') {
      copyToClipboard(preTag.innerText);
    } else {
      showToast('No preformatted text found to copy.', 'info');
    }
  }
});
