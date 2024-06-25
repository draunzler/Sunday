import bot from './assets/logo_dark.svg'
import {marked} from 'marked';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const textarea = document.getElementById("textbox");
const inputForm = document.getElementById('inputForm');
const originalHeight = '41.6px';

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
function typeText(element, text){
  let index = 0;
  let interval = setInterval(() => {
    if(index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 10)
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
    // typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();
    messageDiv.innerHTML = "Something went wrong";
    alert(err);
  }
}

form.addEventListener('submit', (e) => {
  resetHeight(e);
  handleSubmit(e);
});
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13 && !e.shiftKey) {
    e.preventDefault();
  textarea.style.height = originalHeight;
  handleSubmit(e);
  }
})

function resetHeight(e) {
  e.preventDefault();
  console.log("log");
  textarea.style.height = originalHeight;
}

textarea.addEventListener('input', autoResize);

function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, 41.6)}px`;
}