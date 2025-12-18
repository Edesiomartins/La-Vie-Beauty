<?php
// pages/salao.php
// Página de detalhe. O ID vem via querystring: /pages/salao.php?id=XYZ
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>La Vie Beauty | Detalhes</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">

  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/css/styles.css" />
</head>

<body class="bg-lavie">
  <header class="sticky top-0 z-50 backdrop-blur border-b border-rose-100/60 bg-white/75">
    <div class="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
      <a href="/" class="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900">
        <span class="pill">← Voltar</span>
      </a>
      <div class="flex items-center gap-3">
        <div class="brand-mark">LV</div>
        <div>
          <p class="brand-title">La Vie Beauty</p>
          <p class="brand-subtitle">Detalhes Glamour</p>
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-10">
    <div id="loading" class="state-box">Carregando detalhes…</div>
    <div id="error" class="state-box hidden"></div>

    <section id="content" class="hidden">
      <div class="detail-shell">
        <div class="flex flex-col md:flex-row gap-6 md:items-start">
          <div class="detail-avatar" id="avatar">✨</div>

          <div class="flex-1">
            <h1 id="nome" class="detail-title">Nome</h1>
            <p id="categoria" class="detail-subtitle">Salão / Profissional</p>

            <div class="mt-5 grid sm:grid-cols-2 gap-3">
              <div class="info-card">
                <p class="info-label">Endereço</p>
                <p id="endereco" class="info-value">-</p>
              </div>
              <div class="info-card">
                <p class="info-label">Cidade</p>
                <p id="cidade" class="info-value">-</p>
              </div>
              <div class="info-card">
                <p class="info-label">Telefone</p>
                <p id="telefone" class="info-value">-</p>
              </div>
              <div class="info-card">
                <p class="info-label">Plano</p>
                <p id="plano" class="info-value">glamour</p>
              </div>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-3">
              <!-- Link do app: você pode trocar por deep link, store, ou web app -->
              <a id="btnApp" class="btn-gold" target="_blank" rel="noopener" href="https://app.la-vie-beauty.com.br">
                Abrir no app
              </a>

              <a id="btnWhats" class="btn-rose" target="_blank" rel="noopener" href="#">
                Chamar no WhatsApp
              </a>

              <a id="btnMaps" class="btn-outline" target="_blank" rel="noopener" href="#">
                Ver no Maps
              </a>
            </div>

            <div class="mt-6">
              <p class="section-title">Sobre</p>
              <p id="descricao" class="mt-2 text-slate-700 leading-relaxed">
                -
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <script type="module" src="/js/detail.js"></script>
</body>
</html>
