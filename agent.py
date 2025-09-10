import os
import boto3
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Crear aplicación Flask
app = Flask(__name__)
CORS(app)  # Permitir CORS para el frontend

# Verificar variables críticas para agentes personalizados de Bedrock
required_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'BEDROCK_AGENT_ID']
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    logger.error(f"Missing environment variables: {missing_vars}")
    raise ValueError(f"Missing environment variables: {missing_vars}")

class BedrockCustomAgent:
    def __init__(self):
        # Cliente específico para Bedrock Agents
        self.bedrock_agent_runtime = boto3.client(
            'bedrock-agent-runtime',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            aws_session_token=os.getenv('AWS_SESSION_TOKEN'),
            region_name=os.getenv('AWS_REGION')
        )
        self.agent_id = os.getenv('BEDROCK_AGENT_ID')
        self.agent_alias_id = os.getenv('BEDROCK_AGENT_ALIAS_ID')
    
    def invoke(self, prompt):
        """Invoke the custom Bedrock agent"""
        try:
            response = self.bedrock_agent_runtime.invoke_agent(
                agentId=self.agent_id,
                agentAliasId=self.agent_alias_id,
                sessionId=str(uuid.uuid4()),
                inputText=prompt
            )
            
            # Procesar la respuesta streaming
            full_response = ""
            for event in response['completion']:
                if 'chunk' in event:
                    chunk = event['chunk']
                    if 'bytes' in chunk:
                        chunk_text = chunk['bytes'].decode('utf-8')
                        full_response += chunk_text
            
            return full_response
            
        except Exception as e:
            logger.error(f"Error invoking custom agent: {e}")
            raise Exception(f"Error invoking custom agent: {e}")

# Inicializar agente personalizado
custom_agent = BedrockCustomAgent()

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint to verify that the server is running"""
    return jsonify({
        'status': 'ok',
        'message': 'Bedrock Agent API is running',
        'agent_id': os.getenv('BEDROCK_AGENT_ID'),
        'region': os.getenv('AWS_REGION')
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Endpoint to interact with the Bedrock agent"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'The "message" field is required'}), 400
        
        message = data['message']
        logger.info(f"Received message: {message}")
        
        # Invoke the agent
        response = custom_agent.invoke(message)
        
        return jsonify({
            'response': response,
            'status': 'success'
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/examples', methods=['GET'])
def get_examples():
    """Get example prompts for testing"""
    examples = [
        "Hello, how can you assist me today?",
        "Help me generate user stories for a web application"
    ]
    
    return jsonify({
        'examples': examples,
        'status': 'success'
    })

if __name__ == '__main__':
    print("Starting Bedrock Agent API server...")
    print("Please verify that:")
    print("1. Your AWS credentials are valid")
    print("2. You have permissions to use Bedrock Agents")
    print("3. The Agent ID and Alias ID are correct")
    print("4. The region is correct")
    print("="*50)
    app.run(debug=True, host='0.0.0.0', port=5000)