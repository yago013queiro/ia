/**
 * IRON PEAK - AI Chatbot Integration
 * Powered by Google Gemini
 */

// A chave deve ser definida localmente em um arquivo não comitado (por exemplo, config.js).
// Exemplo de arquivo local: window.GEMINI_API_KEY = 'SUA_CHAVE_API_AQUI';
const DEFAULT_GEMINI_API_KEY = '';

const SYSTEM_PROMPT = `
Você é o assistente virtual sênior da academia IRON PEAK. 
Seu objetivo é ajudar os usuários com informações sobre planos, preços, modalidades e localização.
Seja profissional, motivador, direto e amigável.

INFORMAÇÕES DA ACADEMIA:
Nome: IRON PEAK
Localização: Rua Tabosa Facundo - Centro, Canindé - CE, CEP 62700.
Contato: (85) 99999-9999 | contato@ironpeak.com.br

PLANOS E PREÇOS:
1. COMBOS (Acesso a múltiplas modalidades):
   - Básico: R$ 79,90/mês. Musculação livre, vestiário, app de treinos, avaliação física inicial.
   - Pro: R$ 109,90/mês. Musculação + Yoga, Funcional e Spinning ilimitados. Avaliação trimestral e instrutor.
   - Elite: R$ 169,90/mês. Tudo do Pro + Jiu-Jitsu, Boxe, Cross Training, 1 massagem/mês, avaliação mensal, camiseta de boas-vindas.

2. MODALIDADES AVULSAS:
   - Jiu-Jitsu: R$ 89,90/mês.
   - Boxe: R$ 79,90/mês.
   - Cross Training: R$ 89,90/mês.
   - Funcional: R$ 69,90/mês.
   - Yoga: R$ 69,90/mês.
   - Spinning: R$ 69,90/mês.
   - Musculação Solo: R$ 79,90/mês.
   - Pacote Massagem: R$ 199,90/mês (4 sessões).

3. DIÁRIAS (Sem fidelidade):
   - Musculação: R$ 20/dia.
   - Aulas coletivas: R$ 25/dia.
   - Lutas/Cross Training: R$ 35/dia.
   - Massagem: R$ 55/sessão.

DESCONTOS:
- Planos anuais têm 15% de desconto sobre o valor mensal.

DIRETRIZES DE RESPOSTA:
- Se perguntarem sobre preços, sempre mencione o valor e o que está incluso.
- Se perguntarem sobre o melhor plano, sugira o "Pro" por ser o mais popular.
- Incentive o usuário a visitar a academia ou entrar em contato para uma aula experimental.
- Mantenha as respostas curtas e organizadas.
`;

// Chat History to maintain context (must start with 'user' or be empty)
let chatHistory = [];

function initChatbot() {
    // Create Chatbot HTML
    const chatbotHtml = `
        <div class="chatbot-widget">
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <h3>Iron Peak AI</h3>
                    <span class="chatbot-close" id="closeChat">&times;</span>
                </div>
                <div class="chatbot-messages" id="chatbotMessages">
                    <div class="message bot">Olá! Sou o assistente da Iron Peak. Como posso ajudar você com nossos planos hoje?</div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Digite sua dúvida...">
                    <button class="chatbot-send" id="sendChat">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
            <div class="chatbot-button" id="openChat">
                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHtml);

    // Selectors
    const openChatBtn = document.getElementById('openChat');
    const closeChatBtn = document.getElementById('closeChat');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotInput = document.getElementById('chatbotInput');
    const sendChatBtn = document.getElementById('sendChat');
    const messagesContainer = document.getElementById('chatbotMessages');

    // Toggle Chat
    openChatBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('active');
        openChatBtn.style.display = 'none';
    });

    closeChatBtn.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
        openChatBtn.style.display = 'flex';
    });

    // Send Message
    async function handleSendMessage() {
        const message = chatbotInput.value.trim();
        if (!message) return;

        // Check if API key is still the placeholder
        const apiKey = getGeminiApiKey();
        if (apiKey === DEFAULT_GEMINI_API_KEY) {
            addMessage("⚠️ **Erro:** Você ainda não configurou sua chave API local. Copie `config.example.js` para `config.js` e adicione a chave.", 'bot');
            return;
        }

        addMessage(message, 'user');
        chatbotInput.value = '';

        const typingId = addTypingIndicator();

        try {
            const response = await callGeminiAPI(message);
            removeTypingIndicator(typingId);
            addMessage(response, 'bot');
        } catch (error) {
            removeTypingIndicator(typingId);
            console.error("Erro na chamada da API:", error);
            
            let errorMessage = "Desculpe, ocorreu um erro técnico ao processar sua solicitação.";
            
            if (error.message.includes("403") || error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
                errorMessage = "⚠️ Erro de Autenticação: A Chave API configurada não é válida ou expirou. Por favor, verifique as configurações.";
            } else if (error.message.includes("404")) {
                errorMessage = "⚠️ Erro de Modelo: O modelo de IA solicitado não foi encontrado ou não está disponível para esta chave.";
            } else if (error.message.includes("429")) {
                errorMessage = "⚠️ Limite Excedido: Muitas solicitações em pouco tempo. Por favor, aguarde um momento.";
            } else if (error.message.includes("Failed to fetch")) {
                errorMessage = "🌐 Erro de Rede: Não foi possível conectar ao servidor da Google. Verifique sua internet ou se há bloqueios no navegador.";
            } else {
                errorMessage += ` (Detalhe: ${error.message})`;
            }
            
            addMessage(errorMessage, 'bot');
        }
    }

    loadLocalConfig();

    sendChatBtn.addEventListener('click', handleSendMessage);
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    function loadLocalConfig() {
        const script = document.createElement('script');
        script.src = 'config.js';
        script.async = false;
        script.onerror = () => console.warn('config.js não encontrado. Crie-o a partir de config.example.js.');
        document.head.appendChild(script);
    }

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>');
            
        msgDiv.innerHTML = formattedText;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = id;
        indicator.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function getGeminiApiKey() {
        const configuredKey = window.GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
        return configuredKey && configuredKey !== 'SUA_CHAVE_API_AQUI' ? configuredKey : '';
    }

    async function callGeminiAPI(userMessage) {
        const model = 'gemini-1.5-flash';
        const apiKey = getGeminiApiKey();
        const endpoint = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generate?key=${apiKey}`;

        const promptMessages = [
            {
                author: 'system',
                content: [{ text: SYSTEM_PROMPT.trim() }]
            },
            ...chatHistory.map(item => ({
                author: item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user',
                content: item.parts.map(part => ({ text: part.text }))
            })),
            {
                author: 'user',
                content: [{ text: userMessage }]
            }
        ];

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: {
                    messages: promptMessages
                },
                temperature: 0.3,
                maxOutputTokens: 512
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        const botResponse = extractGeminiResponse(data);

        if (!botResponse) {
            throw new Error('A IA não retornou nenhuma resposta.');
        }

        // Update local history
        chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
        chatHistory.push({ role: 'assistant', parts: [{ text: botResponse }] });

        return botResponse;

        function extractGeminiResponse(payload) {
            if (!payload) return null;
            if (typeof payload.outputText === 'string') return payload.outputText;

            const candidate = Array.isArray(payload.candidates) && payload.candidates[0]
                ? payload.candidates[0]
                : null;

            if (candidate) {
                if (typeof candidate.output === 'string') return candidate.output;
                if (Array.isArray(candidate.output) && candidate.output[0]?.content?.[0]?.text) {
                    return candidate.output[0].content[0].text;
                }
                if (Array.isArray(candidate.content) && candidate.content[0]?.text) {
                    return candidate.content[0].text;
                }
            }

            if (Array.isArray(payload.output) && payload.output[0]?.content?.[0]?.text) {
                return payload.output[0].content[0].text;
            }

            if (payload.response?.output?.[0]?.content?.[0]?.text) {
                return payload.response.output[0].content[0].text;
            }

            return null;
        }
    }
}

document.addEventListener('DOMContentLoaded', initChatbot);
