/**
 * IRON PEAK - AI Chatbot Auditado (v2.0)
 */

const API_CONFIG = {
    URL: 'http://localhost:3000/api/chat',
    MAX_RETRY: 2
};

let chatHistory = [];

async function callSecureAPI(userMessage) {
    let attempts = 0;
    
    while (attempts < API_CONFIG.MAX_RETRY) {
        try {
            const response = await fetch(API_CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na comunicação com o servidor');
            }

            return data.response;

        } catch (error) {
            attempts++;
            console.warn(`QA-INFO: Tentativa ${attempts} falhou.`, error.message);
            if (attempts >= API_CONFIG.MAX_RETRY) throw error;
            // Espera curta antes de tentar novamente (Backoff)
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// Injeção do Chatbot
function initChatbot() {
    const chatbotHtml = `
        <div class="chatbot-widget">
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <h3>Iron Peak AI</h3>
                    <span class="chatbot-close" id="closeChat">&times;</span>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot">Olá! Como posso ajudar você hoje?</div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Sua dúvida...">
                    <button class="chatbot-send" id="sendChat">➤</button>
                </div>
            </div>
            <div class="chatbot-button" id="openChat">💬</div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHtml);

    const openBtn = document.getElementById('openChat');
    const closeBtn = document.getElementById('closeChat');
    const windowEl = document.getElementById('chatbotWindow');
    const inputEl = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('sendChat');
    const messagesEl = document.getElementById('chatbotMessages');

    openBtn.onclick = () => { windowEl.classList.add('active'); openBtn.style.display = 'none'; };
    closeBtn.onclick = () => { windowEl.classList.remove('active'); openBtn.style.display = 'flex'; };

    const addMsg = (text, side) => {
        const div = document.createElement('div');
        div.className = `message ${side}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const handleSend = async () => {
        const msg = inputEl.value.trim();
        if (!msg) return;

        addMsg(msg, 'user');
        inputEl.value = '';
        
        // Indicador de "Pensando..."
        const typing = document.createElement('div');
        typing.className = 'message bot';
        typing.innerText = '...';
        messagesEl.appendChild(typing);

        try {
            const botResp = await callSecureAPI(msg);
            typing.remove();
            addMsg(botResp, 'bot');
            chatHistory.push({ role: 'user', content: msg });
            chatHistory.push({ role: 'assistant', content: botResp });
        } catch (err) {
            typing.remove();
            addMsg(`⚠️ ${err.message}`, 'bot');
        }
    };

    sendBtn.onclick = handleSend;
    inputEl.onkeypress = (e) => e.key === 'Enter' && handleSend();
}

document.addEventListener('DOMContentLoaded', initChatbot);
