// api/shorten-url.js
// Encurtador de URL usando TinyURL (gratuito, sem autenticação)

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

        // Usando TinyURL API (gratuita, sem autenticação)
        const tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(tinyUrlApi);
        
        if (!response.ok) {
            throw new Error('Erro ao encurtar URL');
        }

        const shortUrl = await response.text();

        // TinyURL retorna a URL encurtada como texto simples
        if (!shortUrl || shortUrl.startsWith('Error')) {
            throw new Error('Erro ao gerar link encurtado');
        }

        // Remove espaços em branco e quebras de linha
        const cleanShortUrl = shortUrl.trim().replace(/\s+/g, '');

        console.log(`✅ URL encurtada: ${url} -> ${cleanShortUrl}`);

        return res.status(200).json({ 
            shortUrl: cleanShortUrl,
            originalUrl: url 
        });

    } catch (error) {
        console.error('❌ Erro ao encurtar URL:', error);
        return res.status(500).json({ 
            error: 'Erro ao encurtar URL',
            message: error.message 
        });
    }
}

