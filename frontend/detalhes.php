<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detalhes do Salão - La Vie</title>
    <link rel="stylesheet" href="style.css">
    <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>

    <header>
        <a href="index.php" class="logo" style="text-decoration:none">
            <i data-lucide="chevron-left"></i> Voltar
        </a>
        <div class="logo">La Vie</div>
    </header>

    <div id="salonDetail">
        <p style="text-align:center; padding: 50px;">Carregando informações...</p>
    </div>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
        import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

        // MESMA CONFIGURAÇÃO DO INDEX.PHP
        const firebaseConfig = {
            apiKey: "SUA_API_KEY_AQUI",
            authDomain: "SEU_PROJECT_ID.firebaseapp.com",
            projectId: "SEU_PROJECT_ID",
            storageBucket: "SEU_PROJECT_ID.appspot.com",
            messagingSenderId: "SEU_ID",
            appId: "SEU_APP_ID"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        // Pega o ID da URL (?id=XYZ)
        const params = new URLSearchParams(window.location.search);
        const salonId = params.get('id');

        async function loadDetail() {
            if(!salonId) {
                window.location.href = 'index.php';
                return;
            }

            try {
                const docRef = doc(db, "salons", salonId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const salon = docSnap.data();
                    const container = document.getElementById('salonDetail');

                    // LINK PARA O APP (AQUI ESTÁ O SEGREDO)
                    const appLink = `https://app.la-vie-beauty.com.br/?salonId=${salonId}`;

                    container.innerHTML = `
                        <div class="detail-header" style="background-image: url('https://source.unsplash.com/random/800x400/?salon,hair,${salonId}')">
                            <div class="overlay"></div>
                            <div class="detail-info">
                                <h1>${salon.name}</h1>
                                <p><i data-lucide="map-pin"></i> ${salon.address}</p>
                            </div>
                        </div>

                        <div class="detail-content">
                            <h2>Sobre o espaço</h2>
                            <p style="color:#666; line-height:1.6; margin-top:1rem;">
                                ${salon.description || 'Bem-vindo ao nosso espaço. Oferecemos os melhores serviços para realçar sua beleza.'}
                            </p>
                            
                            <hr style="margin: 2rem 0; border:0; border-top:1px solid #eee;">
                            
                            <h3>Serviços Disponíveis</h3>
                            <p style="color:#999; font-size:0.9rem;">(Lista completa e preços no agendamento)</p>
                            
                            <a href="${appLink}" class="btn-agendar">
                                Agendar Horário Agora <i data-lucide="arrow-right" style="vertical-align:middle"></i>
                            </a>
                            
                            <p style="text-align:center; font-size:0.8rem; color:#aaa; margin-top:1rem;">
                                Você será redirecionado para o aplicativo de agendamento.
                            </p>
                        </div>
                    `;
                    lucide.createIcons();
                } else {
                    document.getElementById('salonDetail').innerHTML = '<p align="center">Salão não encontrado.</p>';
                }
            } catch (error) {
                console.error(error);
            }
        }

        loadDetail();
    </script>
</body>
</html>