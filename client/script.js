import bot from './assets/logo_dark.svg';
import copy from './assets/copy.svg';
import {marked} from 'marked';
import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const textarea = document.getElementById("textbox");
const originalHeight = '41.6px';
const forgetButton = document.getElementById('forget');

let loadInterval;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if(element.textContent === '....'){
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

function chatStripe (isAi, value, uniqueId) {
  return (
    `
    <div class = "wrapper ${isAi && 'ai'}">
      <div class = "chat">
        ${isAi ? `<div class="profile">
          <img class="profileImg" src="${bot}" alt="bot"/>
        </div>` : ''}
        <div class = "message" id = ${uniqueId}>${value}</div>
      </div>
    </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const promptData = data.get('prompt').trim();

  if (!promptData) {
    form.classList.add('shake');
    setTimeout(() => {
      form.classList.remove('shake');
    }, 500);
    return;
  }

  console.log(data.get('prompt'))
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  form.reset();

  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;
  const messageDiv = document.getElementById(uniqueId);
  
  const rotatingImage = messageDiv.previousElementSibling.querySelector('.profileImg');
  rotatingImage.classList.add('rotate');
  loader(messageDiv);

  const response = await fetch('https://sunday-hx52.onrender.com/', {
    // http://127.0.0.1:8000/https://sunday-hx52.onrender.com/
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  rotatingImage.classList.remove('rotate');

  if(response.ok) {
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
    messageDiv.innerHTML = "Something went wrong";
    Toastify({
      text: `${err}`,
      duration: 3000,
      className: "error",
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#101010",
        boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px ##CC1E4A50"
      }
    }).showToast();
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
})

forgetButton.addEventListener('click', async () => {
  try {
    const response = await fetch('https://sunday-hx52.onrender.com/forget', {
      method: 'POST',
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      Toastify({
        text: `${data.message}`,
        duration: 3000,
        className: "success",
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "#101010",
          boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px #58D03350"
        }
      }).showToast();
    } else {
      const error = await response.text();
      console.error('Error clearing memory:', error);
      Toastify({
        text: `Error clearing memory: ${error}`,
        duration: 3000,
        className: "error",
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "#101010",
          boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px ##CC1E4A50"
        }
      }).showToast();
    }
  } catch (error) {
    console.error('Error fetching forget endpoint:', error);
    Toastify({
      text: `Error fetchig forget endpoint: ${error}`,
      duration: 3000,
      className: "error",
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#101010",
        boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px #CC1E4A50"
      }
    }).showToast();
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
  document.getElementById('myTextarea').focus(); 
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    Toastify({
      text: `Copied to clipboard!`,
      duration: 3000,
      className: "success",
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#101010",
        boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px #58D03350"
      }
    }).showToast();
  }).catch(err => {
    console.error("Could not copy text: ", err);
    Toastify({
      text: `Failed to copy to clipboard.`,
      duration: 3000,
      className: "error",
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: "#101010",
        boxShadow: "0 3px 6px -1px rgba(0, 0, 0, 0.12), 0 10px 36px -4px #CC1E4A50"
      }
    }).showToast();
  });
}

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('copy-btn')) {
    const preTag = event.target.previousElementSibling;

    if (preTag && preTag.tagName.toLowerCase() === 'pre') {
      copyToClipboard(preTag.innerText);
    } else {
      Toastify({
        text: `No preformatted text found to copy.`,
        duration: 3000,
        className: "info",
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "#101010",
        }
      }).showToast();
    }
  }
});