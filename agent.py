import os
import boto3
import uuid
from dotenv import load_dotenv

load_dotenv()

# Verificar variables críticas para agentes personalizados de Bedrock
required_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'BEDROCK_AGENT_ID']
missing_vars = [var for var in required_vars if not os.getenv(var)]

if missing_vars:
    raise ValueError(f"Variables de entorno faltantes: {missing_vars}")

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
        """Invocar el agente personalizado de Bedrock"""
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
            raise Exception(f"Error invocando agente personalizado: {e}")

# Inicializar agente personalizado
custom_agent = BedrockCustomAgent()

try:
    # Generar respuesta usando agente personalizado de Bedrock
    response = custom_agent.invoke("Hello, how can you assist me today? I need help generating user stories for a web application.")
    
    print("Respuesta del agente personalizado de Bedrock:")
    print("="*50)
    print(response)

except Exception as e:
    print(f"Error generando respuesta: {e}")
    print("Verifica que:")
    print("1. Tus credenciales AWS sean válidas")
    print("2. Tengas permisos para usar Bedrock Agents")
    print("3. El Agent ID y Alias ID sean correctos")
    print("4. La región sea la correcta")
    print("5. La librería strands-agents esté instalada correctamente")