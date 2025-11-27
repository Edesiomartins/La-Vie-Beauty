// Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebaseConfig'; // Certifique-se de que firebaseConfig.js está configurado
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const FloatingChat = ({ clientId, salonId, setView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const conversationRef = useRef(null); // Para armazenar a referência do documento da conversa

  // Debug: verificar se o componente está sendo renderizado
  useEffect(() => {
    console.log('💬 FloatingChat renderizado:', { clientId, salonId });
    console.log('💬 clientId:', clientId);
    console.log('💬 salonId:', salonId);
  }, [clientId, salonId]);

  // Scroll para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!clientId || !salonId) return;

    const fetchOrCreateConversation = async () => {
      const q = query(
        collection(db, 'chat_conversations'),
        where('clientId', '==', clientId),
        where('salonId', '==', salonId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Conversa existente
        conversationRef.current = querySnapshot.docs[0].ref;
        const initialMessages = querySnapshot.docs[0].data().messages || [];
        setMessages(initialMessages);
      } else {
        // Nova conversa
        const newConversationRef = await addDoc(collection(db, 'chat_conversations'), {
          clientId,
          salonId,
          messages: [],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
        conversationRef.current = newConversationRef;
      }

      // Listener em tempo real para novas mensagens
      const unsubscribe = onSnapshot(conversationRef.current, (docSnap) => {
        if (docSnap.exists()) {
          setMessages(docSnap.data().messages || []);
        }
      });

      return () => unsubscribe();
    };

    if (isOpen) {
      fetchOrCreateConversation();
    }
  }, [clientId, salonId, isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !conversationRef.current) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(), // Usar ISO string ao invés de serverTimestamp() para arrays
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Atualiza o Firestore com a mensagem do usuário
      // Converter timestamps para objetos compatíveis com Firestore
      const messagesForFirestore = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      }));
      
      await updateDoc(conversationRef.current, {
        messages: messagesForFirestore,
        lastUpdated: serverTimestamp(), // serverTimestamp() só para campos diretos
      });

      // Chama a Vercel Function
      // Em desenvolvimento, usar localhost:3000 se Vercel CLI estiver rodando
      // Em produção, usar a URL relativa
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:3000/api/chat' 
        : '/api/chat';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          clientId,
          salonId,
          conversationId: conversationRef.current.id,
          history: updatedMessages.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        role: 'bot',
        content: data.content || data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date().toISOString(), // Usar ISO string ao invés de serverTimestamp() para arrays
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Atualiza o Firestore com a resposta do bot
      // Converter timestamps para objetos compatíveis com Firestore
      const finalMessagesForFirestore = finalMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString()
      }));
      
      await updateDoc(conversationRef.current, {
        messages: finalMessagesForFirestore,
        lastUpdated: serverTimestamp(), // serverTimestamp() só para campos diretos
      });

      // Lidar com ações do bot (ex: agendamento confirmado)
      if (data.action === 'booking_confirmed' && setView) {
        // Opcional: Navegar para uma tela de confirmação ou exibir um toast
        console.log('Agendamento confirmado:', data.bookingData);
        // setView('bookingConfirmation', { bookingId: data.bookingData.id });
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Desculpe, houve um erro. Tente novamente.', 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute', // Mudado de fixed para absolute para funcionar dentro do container
          bottom: '20px',
          right: '20px',
          backgroundColor: '#ec4899', // Cor rosa para combinar com o tema
          color: 'white',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 4px 20px rgba(236, 72, 153, 0.4)',
          zIndex: 9999, // Z-index muito alto para aparecer acima de tudo
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0px 6px 25px rgba(236, 72, 153, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0px 4px 20px rgba(236, 72, 153, 0.4)';
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Modal do Chat */}
      {isOpen && (
        <div
          style={{
            position: 'absolute', // Mudado de fixed para absolute
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            zIndex: 9998, // Abaixo do botão mas acima de tudo
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevenir overflow
          }}
        >
          {/* Header do Chat */}
          <div
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              zIndex: 1, // Header com z-index baixo
              flexShrink: 0, // Não encolher
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: 0, flex: 1 }}>La Vie Beauty Chat</h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '1.2rem',
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
                flexShrink: 0,
                position: 'relative',
                zIndex: 1, // Mesmo nível do header (baixo)
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
              ✕
            </button>
          </div>

          {/* Área de Mensagens */}
          <div
            style={{
              flexGrow: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#f9f9f9',
              minHeight: 0, // Permite que o flex funcione corretamente
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.role === 'user' ? '#E0E7FF' : '#FFFFFF',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  maxWidth: '80%',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                  wordBreak: 'break-word',
                }}
              >
                <p style={{ margin: 0, color: '#333' }}>{msg.content}</p>
                {msg.timestamp && (
                  <span style={{ fontSize: '0.75rem', color: '#888', display: 'block', textAlign: msg.role === 'user' ? 'right' : 'left', marginTop: '5px' }}>
                    {msg.timestamp?.toDate ? 
                      new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                      new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  </span>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: '#FFFFFF', padding: '10px 15px', borderRadius: '15px', maxWidth: '80%', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)' }}>
                <p style={{ margin: 0, color: '#333' }}>Digitando...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagens */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '10px',
              position: 'sticky', // Mudado para sticky para garantir que fique no fundo
              bottom: 0,
              zIndex: 100, // Z-index muito alto para ficar acima de tudo
              flexShrink: 0, // Não encolher
              boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)', // Sombra para destacar
            }}
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              style={{
                flexGrow: 1,
                padding: '12px 16px',
                borderRadius: '25px',
                border: '1px solid #CBD5E0',
                fontSize: '1rem',
                outline: 'none',
                position: 'relative',
                zIndex: 101, // Acima do container
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              style={{
                backgroundColor: '#ec4899',
                color: 'white',
                borderRadius: '25px',
                padding: '12px 20px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.7 : 1,
                flexShrink: 0,
                transition: 'opacity 0.2s, transform 0.1s',
                position: 'relative',
                zIndex: 102, // Z-index mais alto que o input
              }}
              disabled={isLoading}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;