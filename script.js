// Elementos de interação
const chatBox = document.querySelector('.chat-box');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendMessageButton');
const micButton = document.getElementById('micButton');
const soundToggleButton = document.getElementById('soundToggleButton');
const clearChatButton = document.getElementById('clearChatButton');
const setVoiceButton = document.getElementById('setVoiceButton');
const voiceSelect = document.getElementById('voiceSelect');
let isSoundOn = true;

// Verifica se o navegador suporta a API de síntese de fala e reconhecimento de voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if ('speechSynthesis' in window) {
  const synth = window.speechSynthesis;

  // Carrega as vozes disponíveis
  synth.onvoiceschanged = () => {
    const voices = synth.getVoices();
    
    // Adiciona as vozes ao menu suspenso
    voices.forEach(voice => {
      if (voice.name === "Microsoft Francisca Online (Natural) - Portuguese (Brazil)" || 
          voice.name === "Microsoft AndrewMultilingual Online (Natural) - English (United States)" ||
          voice.name === "Microsoft Daniel - Portuguese (Brazil)" ||
          voice.name === "Microsoft Maria - Portuguese (Brazil)") {
          
        const option = document.createElement('option');
        option.value = voice.voiceURI; // Usar voiceURI como valor
        
        // Alterar o nome mostrado no select
        option.textContent = voice.name === "Microsoft Francisca Online (Natural) - Portuguese (Brazil)" ? "Feminina (Humanizada)" :
                             voice.name === "Microsoft AndrewMultilingual Online (Natural) - English (United States)" ? "Masculina (Humanizada)" :
                             voice.name === "Microsoft Daniel - Portuguese (Brazil)" ? "Masculina" : 
                             voice.name === "Microsoft Maria - Portuguese (Brazil)" ? "Feminina";
        
        voiceSelect.appendChild(option);
      }
    });
  };

  // Função para falar o texto
  function speak(text) {
    if (!isSoundOn) return; // Não fala se o som estiver desativado

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voiceSelect.value;

    // Seleciona a voz desejada usando voiceURI
    const voices = synth.getVoices();
    const voice = voices.find(v => v.voiceURI === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  }

  // Botão para definir a voz
  setVoiceButton.addEventListener('click', () => {
    voiceSelect.style.display = voiceSelect.style.display === 'none' ? 'block' : 'none';
  });
} else {
  alert('Desculpe, seu navegador não suporta a API de síntese de fala.');
}

// Verificação de suporte ao reconhecimento de voz
if (SpeechRecognition) {
  // API de reconhecimento de voz
  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR'; // Definir o idioma para Português

  // Evento de clique no botão de microfone
  micButton.addEventListener('click', () => {
    recognition.start(); // Iniciar reconhecimento de voz
  });

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript; // Extrair o texto da fala reconhecida
    displayMessage(voiceText, 'user'); // Exibir a mensagem do usuário
    getAssistantResponse(voiceText); // Obter a resposta do assistente
  };

  recognition.onerror = (event) => {
    console.error("Erro no reconhecimento de voz: ", event.error);
    alert("Houve um erro com o reconhecimento de voz. Por favor, tente novamente.");
  };
} else {
  console.warn("API de reconhecimento de voz não é suportada neste navegador.");
  micButton.addEventListener('click', () => {
    alert("O reconhecimento de voz não é suportado neste navegador. Por favor, use o Google Chrome.");
  });
}

// Botão de alternância de som
soundToggleButton.addEventListener('click', () => {
  isSoundOn = !isSoundOn;

  // Interromper fala em andamento se o som estiver sendo desligado
  if (!isSoundOn) {
    speechSynthesis.cancel();
  }

  // Alterar ícone conforme o status do som
  soundToggleButton.innerHTML = isSoundOn 
      ? '<i class="bi bi-volume-up-fill"></i>' 
      : '<i class="bi bi-volume-mute-fill"></i>';
});

// Função para exibir mensagens no chat
function displayMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add(type === 'user' ? 'user-message' : 'assistant-message');
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll para a última mensagem
}

// Função para obter a resposta do assistente via API
async function getAssistantResponse(message) {
  const loadingMessage = "Estou processando sua pergunta...";
  displayMessage(loadingMessage, 'assistant'); // Exibe a mensagem de carregamento

  try {
    console.log("Enviando mensagem:", message);

    // Atualize para a URL de produção
    const response = await fetch('https://panapi-production.up.railway.app/answer-user/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }), // Enviando a mensagem como JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Erro ao obter resposta do assistente");
    }

    const data = await response.json();
    console.log("Estrutura de dados recebidos:", data); // Exibir estrutura dos dados

    // Acessar a resposta bruta a partir do campo 'raw'
    const rawResponse = data.raw || "Resposta não encontrada"; // Se 'raw' não existir

    // Remover a mensagem de carregamento
    const assistantMessages = document.querySelectorAll('.assistant-message');
    if (assistantMessages.length > 0) {
      assistantMessages[assistantMessages.length - 1].remove(); // Remove a última mensagem de carregamento
    }

    displayMessage(rawResponse, 'assistant'); // Exibir a resposta no chat
    speak(rawResponse); // Falar a resposta caso o som esteja ativado

  } catch (error) {
    console.error("Erro ao processar a resposta do assistente:", error);
    const errorMessage = "Desculpe, ocorreu um erro ao obter a resposta: " + error.message;

    // Remover a mensagem de carregamento em caso de erro
    const assistantMessages = document.querySelectorAll('.assistant-message');
    if (assistantMessages.length > 0) {
      assistantMessages[assistantMessages.length - 1].remove(); // Remove a última mensagem de carregamento
    }

    displayMessage(errorMessage, 'assistant'); // Exibir mensagem de erro
    speak(errorMessage); // Falar o erro caso o som esteja ativado
  }
}

// Função para processar o envio da mensagem
function sendMessage() {
  const userText = userInput.value.trim(); // Remove espaços em branco desnecessários
  if (userText) { // Verifica se o campo não está vazio
    displayMessage(userText, 'user'); // Exibir a mensagem do usuário
    getAssistantResponse(userText);   // Obter a resposta do assistente
    userInput.value = ''; // Limpa o campo de entrada
  }
}


// Envio de mensagem ao pressionar a tecla Enter
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Envio de mensagem ao clicar no botão de enviar
sendButton.addEventListener('click', sendMessage);

// Função para limpar o chat
clearChatButton.addEventListener('click', () => {
  chatBox.innerHTML = ''; // Limpa todo o conteúdo do chat
});

document.getElementById('feedbackButton').addEventListener('click', async () => {
    const feedbackText = document.getElementById('feedbackText').value;
    const feedbackMessage = document.getElementById('feedbackMessage');
    const feedbackId = crypto.randomUUID(); // Gera um UUID para o feedback

    try {
        const response = await fetch("https://panapi-production.up.railway.app/save_feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: feedbackText,
                feedback_id: feedbackId
            })
        });

        if (response.ok) {
            feedbackMessage.style.display = 'block';
            feedbackMessage.textContent = "Feedback salvo com sucesso!";
            feedbackMessage.style.color = 'green';
        } else {
            feedbackMessage.style.display = 'block';
            feedbackMessage.textContent = "Erro ao salvar feedback.";
            feedbackMessage.style.color = 'red';
        }
    } catch (error) {
        feedbackMessage.style.display = 'block';
        feedbackMessage.textContent = "Erro ao enviar feedback: " + error.message;
        feedbackMessage.style.color = 'red';
    }

    // Mensagem de agradecimento
    feedbackMessage.style.display = 'block';
    feedbackMessage.textContent = "Obrigado pela sua sugestão! Sua opinião é muito importante para nós e nos ajuda a melhorar constantemente. Agradecemos pelo seu tempo e feedback!";
    feedbackMessage.style.color = 'blue';

    // Limpa o campo de texto
    document.getElementById('feedbackText').value = '';

    // Esconde a mensagem de agradecimento após 5 segundos
    setTimeout(function() {
        feedbackMessage.style.display = 'none';
    }, 5000); // 5000ms = 5 segundos
});
// Alternar tema
document.addEventListener('DOMContentLoaded', () => {
  const toggleThemeButton = document.getElementById('toggleThemeButton');

  toggleThemeButton.addEventListener('click', () => {
    // Alterna a classe do body entre 'dark-mode' e 'light-mode'
    document.body.classList.toggle('dark-mode');
    
    // Obtém todos os elementos relevantes e alterna suas classes
    const elementsToToggle = [
      '.chat-container',
      '.header',
      '.chat-box',
      '.input-section',
      '.feedback-container',
      ...document.querySelectorAll('.user-message, .assistant-message')
    ];

    elementsToToggle.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.classList.toggle('dark-mode');
      }
    });
  });
});
