<?php
// pages/salao.php
?>
<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>La Vie Beauty | Detalhes do Parceiro</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/css/styles.css" />
</head>
<body class="bg-gray-50 pb-20">

  <nav class="absolute top-0 w-full z-20 border-b border-white/20 bg-black/20 backdrop-blur-sm">
    <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between text-white">
      <a href="/" class="flex items-center gap-2 hover:text-rose-200 transition">
        <span>&larr; Voltar para vitrine</span>
      </a>
      <span class="font-serif font-bold tracking-wide">La Vie Beauty</span>
    </div>
  </nav>

  <header id="heroCover" class="relative h-[300px] md:h-[400px] bg-slate-800 bg-cover bg-center">
    <div class="absolute inset-0 bg-black/40"></div>
  </header>

  <main class="max-w-6xl mx-auto px-4 relative z-10 -mt-20">
    <div id="loading" class="text-center py-10 bg-white rounded-xl shadow p-10">Carregando perfil...</div>
    <div id="error" class="hidden bg-red-100 text-red-600 p-4 rounded-xl text-center"></div>

    <div id="content" class="hidden grid lg:grid-cols-[1fr_350px] gap-8">
      
      <div class="space-y-6">
        <div class="bg-white rounded-3xl p-8 shadow-xl">
          <div class="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 mb-4">
            <div id="avatarBox" class="w-32 h-32 rounded-3xl bg-white p-1 shadow-lg flex items-center justify-center text-4xl border border-gray-100 overflow-hidden">
              <span id="avatarEmoji">✨</span>
            </div>
            <div class="flex-1 pb-2">
              <span id="categoria" class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Categoria</span>
              <h1 id="nome" class="text-4xl font-serif font-bold text-slate-900 mt-2">Nome do Salão</h1>
              <p id="cidade" class="text-slate-500 mt-1 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                Cidade - UF
              </p>
            </div>
          </div>
          
          <hr class="border-slate-100 my-6">
          
          <h3 class="text-xl font-bold font-serif mb-4">Sobre</h3>
          <p id="descricao" class="text-slate-600 leading-relaxed text-lg">
            Carregando descrição...
          </p>

          <div class="mt-8 grid grid-cols-2 gap-4">
            <div class="bg-gray-50 p-4 rounded-xl">
              <p class="text-xs text-slate-400 uppercase font-bold">Plano Ativo</p>
              <p class="text-rose-600 font-bold flex items-center gap-2">
                <span id="plano">Glamour</span> ✨
              </p>
            </div>
             <div class="bg-gray-50 p-4 rounded-xl">
              <p class="text-xs text-slate-400 uppercase font-bold">Verificado</p>
              <p class="text-green-600 font-bold flex items-center gap-2">Sim ✅</p>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-6">
        <div class="bg-white rounded-3xl p-6 shadow-xl sticky top-24 border border-rose-50">
          <h3 class="text-lg font-bold font-serif mb-6">Agendamento & Contato</h3>
          
          <a id="btnApp" href="#" target="_blank" class="btn-primary w-full justify-center mb-3 py-3 text-lg shadow-rose-200">
            Agendar no App
          </a>
          <a id="btnWhats" href="#" target="_blank" class="btn-outline w-full justify-center mb-3 border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500">
            WhatsApp
          </a>

          <div class="mt-8 space-y-4">
            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase">Endereço</p>
                <p id="endereco" class="text-sm font-medium text-slate-700">Rua...</p>
                <a id="btnMaps" href="#" target="_blank" class="text-xs text-rose-600 underline mt-1 block">Ver no mapa</a>
              </div>
            </div>

            <div class="flex gap-3">
              <div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase">Telefone</p>
                <p id="telefone" class="text-sm font-medium text-slate-700">-</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </main>

  <script type="module" src="/js/detail.js"></script>
</body>
</html>