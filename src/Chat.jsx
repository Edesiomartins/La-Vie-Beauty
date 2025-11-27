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
      timestamp: serverTimestamp(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Atualiza o Firestore com a mensagem do usuário
      await updateDoc(conversationRef.current, {
        messages: updatedMessages,
        lastUpdated: serverTimestamp(),
      });

      // Chama a Vercel Function
      const response = await fetch('/api/chat', {
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
        content: data.response,
        timestamp: serverTimestamp(),
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Atualiza o Firestore com a resposta do bot
      await updateDoc(conversationRef.current, {
        messages: finalMessages,
        lastUpdated: serverTimestamp(),
      });

      // Lidar com ações do bot (ex: agendamento confirmado)
      if (data.action === 'booking_confirmed' && setView) {
        // Opcional: Navegar para uma tela de confirmação ou exibir um toast
        console.log('Agendamento confirmado:', data.bookingData);
        // setView('bookingConfirmation', { bookingId: data.bookingData.id });
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Desculpe, houve um erro. Tente novamente.', timestamp: serverTimestamp() }]);
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
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#6B46C1', // Cor roxa
          color: 'white',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Modal do Chat */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header do Chat */}
          <div
            style={{
              backgroundColor: '#6B46C1',
              color: 'white',
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>La Vie Beauty Chat</h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
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
                padding: '12px',
                borderRadius: '25px',
                border: '1px solid #CBD5E0',
                fontSize: '1rem',
                outline: 'none',
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              style={{
                backgroundColor: '#6B46C1',
                color: 'white',
                borderRadius: '25px',
                padding: '12px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isLoading ? 0.7 : 1,
              }}
              disabled={isLoading}
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