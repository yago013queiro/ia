import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { rateLimit } from 'express-rate-limit';

// 1. Configuração de Segurança de Ambiente
dotenv.config();

if (!process.env.GROQ_API_KEY) {
    console.error('❌ ERRO CRÍTICO: GROQ_API_KEY não definida no arquivo .env');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware de Segurança
// Limita requisições para evitar abusos e custos inesperados
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita cada IP a 100 requisições por janela
    message: { error: 'Muitas solicitações vindas deste IP, tente novamente mais tarde.' }
});

app.use(limiter);
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5500', // Ajuste para a URL do seu Live Server
    methods: ['POST']
}));
app.use(express.json({ limit: '10kb' })); // Proteção contra payloads gigantes

// 3. Inicialização do SDK
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `Você é o assistente virtual da IRON PEAK. 
Responda de forma curta, motivadora e profissional. 
Foco: Planos, Preços e Horários.`;

// 4. Endpoint Robusto
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        // Validação de entrada
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem inválida ou ausente.' });
        }

        // Sanitização e formatação do histórico (máximo 10 mensagens para economizar tokens/contexto)
        const chatMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).slice(-10).map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: String(msg.content).substring(0, 1000) // Limite de caracteres por msg
            })),
            { role: 'user', content: message.substring(0, 1000) }
        ];

        // Chamada com Timeout manual para evitar processos pendentes
        const completion = await groq.chat.completions.create({
            messages: chatMessages,
            model: 'llama3-8b-8192',
            temperature: 0.5,
            max_tokens: 512,
            top_p: 1,
            stream: false,
        }).catch(err => {
            // Tratamento específico de erros da Groq (Rate Limit, Auth, etc)
            if (err.status === 429) throw new Error('LIMITE_EXCEDIDO');
            if (err.status === 401) throw new Error('ERRO_AUTENTICACAO');
            throw err;
        });

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText) {
            throw new Error('RESPOSTA_VAZIA');
        }

        res.json({ 
            success: true,
            response: responseText 
        });

    } catch (error) {
        console.error('QA-LOG [Erro Chat]:', error.message);

        // Mapeamento de erros amigáveis para o cliente sem expor stack traces
        let clientError = 'Erro ao processar sua dúvida. Tente novamente.';
        let statusCode = 500;

        if (error.message === 'LIMITE_EXCEDIDO') {
            clientError = 'A IA está muito ocupada agora. Por favor, aguarde um minuto.';
            statusCode = 429;
        } else if (error.message === 'ERRO_AUTENTICACAO') {
            clientError = 'Erro interno de configuração (Chave API).';
            statusCode = 500;
        }

        res.status(statusCode).json({ error: clientError });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor Auditado rodando em http://localhost:${PORT}`);
});
