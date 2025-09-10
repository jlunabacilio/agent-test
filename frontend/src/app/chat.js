'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    // Verificar estado del servidor
    checkServerHealth();
    // Cargar ejemplos
    loadExamples();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setServerStatus(response.data);
    } catch (error) {
      console.error('Error conectando con el servidor:', error);
      setServerStatus({ status: 'error', message: 'No se puede conectar con el servidor' });
    }
  };

  const loadExamples = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/examples`);
      setExamples(response.data.examples);
    } catch (error) {
      console.error('Error cargando ejemplos:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    // Agregar mensaje del usuario a la conversación
    setConversation(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage
      });

      // Agregar respuesta del agente
      setConversation(prev => [...prev, { 
        type: 'agent', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      setConversation(prev => [...prev, { 
        type: 'error', 
        content: 'Error: No se pudo obtener respuesta del agente. Verifica que el servidor esté ejecutándose.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const useExample = (example) => {
    setMessage(example);
  };

  const clearConversation = () => {
    setConversation([]);
  };

  return (
    <div className="container-fluid h-100" style={{ minHeight: '100vh' }}>
      <div className="row h-100">
        {/* Sidebar con información y ejemplos */}
        <div className="col-md-3 bg-light p-4 border-end">
          <h4 className="mb-4">
            🤖 Bedrock Agent
          </h4>

          {/* Estado del servidor */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Estado del Servidor</h6>
            </div>
            <div className="card-body">
              {serverStatus ? (
                <div className={`alert ${serverStatus.status === 'ok' ? 'alert-success' : 'alert-danger'} mb-0`}>
                  <small>
                    <strong>Estado:</strong> {serverStatus.status}<br/>
                    <strong>Mensaje:</strong> {serverStatus.message}<br/>
                    {serverStatus.agent_id && (
                      <>
                        <strong>Agent ID:</strong> {serverStatus.agent_id}<br/>
                        <strong>Región:</strong> {serverStatus.region}
                      </>
                    )}
                  </small>
                </div>
              ) : (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              )}
            </div>
          </div>

          {/* Ejemplos */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Ejemplos de Prompts</h6>
            </div>
            <div className="card-body">
              {examples.map((example, index) => (
                <button
                  key={index}
                  className="btn btn-outline-primary btn-sm mb-2 w-100 text-start"
                  onClick={() => useExample(example)}
                  style={{ fontSize: '0.8rem' }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área principal de chat */}
        <div className="col-md-9 d-flex flex-column">
          {/* Header */}
          <div className="bg-primary text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Chat con Agente de Bedrock</h2>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={clearConversation}
              >
                🗑️ Limpiar Chat
              </button>
            </div>
          </div>

          {/* Área de conversación */}
          <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {conversation.length === 0 ? (
              <div className="text-center text-muted mt-5">
                <div className="display-1 mb-3">💬</div>
                <h4>¡Hola! Soy tu agente de AWS Bedrock</h4>
                <p>Envíame un mensaje para comenzar nuestra conversación.</p>
              </div>
            ) : (
              <div className="conversation">
                {conversation.map((msg, index) => (
                  <div key={index} className={`mb-3 ${msg.type === 'user' ? 'text-end' : 'text-start'}`}>
                    <div className={`d-inline-block p-3 rounded-3 ${
                      msg.type === 'user' 
                        ? 'bg-primary text-white' 
                        : msg.type === 'error'
                        ? 'bg-danger text-white'
                        : 'bg-light border'
                    }`} style={{ maxWidth: '80%' }}>
                      <div className="mb-1">
                        <strong>
                          {msg.type === 'user' ? 'Tú' : msg.type === 'error' ? 'Error' : 'Agente Bedrock'}
                        </strong>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="mb-3 text-start">
                    <div className="d-inline-block p-3 rounded-3 bg-light border" style={{ maxWidth: '80%' }}>
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                        <span>El agente está pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulario de envío */}
          <div className="p-4 border-top bg-light">
            <form onSubmit={sendMessage}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
                <button 
                  className="btn btn-primary" 
                  type="submit"
                  disabled={loading || !message.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      ✉️ Enviar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
