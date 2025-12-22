// api/shorten-url.js
// Encurtador de URL usando TinyURL API v1 (com token - sem página intermediária)
// Token configurado em: TINYURL_API_TOKEN

import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default async function shortenUrlHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { url } = req.body;

        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL é obrigatória' });
        }

        // Validação básica de URL
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: 'URL inválida' });
        }

        const tinyUrlToken = process.env.TINYURL_API_TOKEN;

        if (!tinyUrlToken) {
            return res.status(500).json({ 
                error: 'TINYURL_API_TOKEN não configurado',
                message: 'Configure TINYURL_API_TOKEN no .env.local'
            });
        }

        // Usa TinyURL API v1 com token (redirecionamento direto sem página intermediária)
        // Endpoint: https://api.tinyurl.com/create
        const tinyUrlResponse = await fetch('https://api.tinyurl.com/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tinyUrlToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url
            })
        });

        if (!tinyUrlResponse.ok) {
            const errorText = await tinyUrlResponse.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || 'Erro ao encurtar URL no TinyURL' };
            }
            const errorMessage = errorData.message || errorData.errors?.[0]?.message || errorData.errors?.[0] || 'Erro ao encurtar URL no TinyURL';
            console.error('❌ Erro TinyURL API:', errorMessage, errorData);
            throw new Error(errorMessage);
        }

        const tinyUrlData = await tinyUrlResponse.json();
        // A resposta pode vir em diferentes formatos: data.tiny_url ou tiny_url diretamente
        const shortUrl = tinyUrlData.data?.tiny_url || tinyUrlData.data?.url || tinyUrlData.tiny_url || tinyUrlData.url;

        if (!shortUrl) {
            throw new Error('Resposta inválida do TinyURL');
        }

        console.log(`✅ URL encurtada (TinyURL): ${url} -> ${shortUrl}`);

        return res.status(200).json({ 
            shortUrl: shortUrl,
            originalUrl: url,
            provider: 'tinyurl'
        });

    } catch (error) {
        console.error('❌ Erro ao encurtar URL:', error);
        return res.status(500).json({ 
            error: 'Erro ao encurtar URL',
            message: error.message 
        });
    }
}

