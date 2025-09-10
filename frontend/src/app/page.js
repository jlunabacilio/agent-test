'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState([]);
  const [serverStatus, setServerStatus] = useState(null);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    checkServerHealth();
    loadExamples();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      setServerStatus(response.data);
    } catch (error) {
      console.error('Error connecting to server:', error);
      setServerStatus({ status: 'error', message: 'Cannot connect to server' });
    }
  };

  const loadExamples = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/examples`);
      setExamples(response.data.examples);
    } catch (error) {
      console.error('Error loading examples:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    setConversation(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: userMessage
      });

      setConversation(prev => [...prev, { 
        type: 'agent', 
        content: response.data.response 
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setConversation(prev => [...prev, { 
        type: 'error', 
        content: 'Error: Could not get response from agent. Please verify that the server is running.' 
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
        <div className="col-md-3 bg-light p-4 border-end">
          <h4 className="mb-4">🤖 Bedrock Agent</h4>

          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0">Server Status</h6>
            </div>
            <div className="card-body">
              {serverStatus ? (
                <div className={`alert ${serverStatus.status === 'ok' ? 'alert-success' : 'alert-danger'} mb-0`}>
                  <small>
                    <strong>Status:</strong> {serverStatus.status}<br/>
                    <strong>Message:</strong> {serverStatus.message}<br/>
                    {serverStatus.agent_id && (
                      <>
                        <strong>Agent ID:</strong> {serverStatus.agent_id}<br/>
                        <strong>Region:</strong> {serverStatus.region}
                      </>
                    )}
                  </small>
                </div>
              ) : (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Prompt Examples</h6>
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

        <div className="col-md-9 d-flex flex-column">
          <div className="bg-primary text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="mb-0">Chat with Bedrock Agent</h2>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={clearConversation}
              >
                🗑️ Clear Chat
              </button>
            </div>
          </div>

          <div className="flex-grow-1 p-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {conversation.length === 0 ? (
              <div className="text-center text-muted mt-5">
                <div className="display-1 mb-3">💬</div>
                <h4>Hello! I'm your AWS Bedrock agent</h4>
                <p>Send me a message to start our conversation.</p>
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
                          {msg.type === 'user' ? 'You' : msg.type === 'error' ? 'Error' : 'Bedrock Agent'}
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
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span>The agent is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-top bg-light">
            <form onSubmit={sendMessage}>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type your message here..."
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
                      Sending...
                    </>
                  ) : (
                    '✉️ Send'
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
