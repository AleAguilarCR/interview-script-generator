from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import logging

app = Flask(__name__)
CORS(app)  # Permitir CORS para todas las rutas

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar Gemini con la misma API key que funciona
try:
    genai.configure(api_key='AIzaSyAgBFK5IYDrsXMlY54ygaO70M0jR5tP_iA')
    
    # Listar modelos disponibles
    logger.info("Listando modelos disponibles...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            logger.info(f"Modelo disponible: {m.name}")
    
    # Intentar con diferentes modelos (empezando por los más nuevos)
    model_names = ['gemini-2.5-flash', 'gemini-pro', 'gemini-2.0-flash', 'models/gemini-pro']
    model = None
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            logger.info(f"Modelo configurado exitosamente: {model_name}")
            break
        except Exception as e:
            logger.warning(f"No se pudo configurar {model_name}: {e}")
    
    if model is None:
        raise Exception("No se pudo configurar ningún modelo")
        
except Exception as e:
    model = None
    logger.error(f"Error configurando Gemini AI: {e}")

@app.route('/generate', methods=['POST'])
def generate_content():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        if not prompt:
            return jsonify({'error': 'Prompt requerido'}), 400
        
        if model is None:
            return jsonify({'error': 'Gemini no configurado'}), 500
        
        logger.info(f"Generando contenido para prompt de {len(prompt)} caracteres")
        
        # Usar el mismo modelo que funciona en diagnostico-digital
        response = model.generate_content(prompt)
        
        if response.text:
            logger.info(f"Respuesta generada exitosamente: {len(response.text)} caracteres")
            return jsonify({
                'success': True,
                'text': response.text
            })
        else:
            logger.error("Respuesta vacía de Gemini")
            return jsonify({'error': 'Respuesta vacía de Gemini'}), 500
            
    except Exception as e:
        logger.error(f"Error generando contenido: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    available_models = []
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
    except:
        pass
    
    return jsonify({
        'status': 'ok',
        'gemini_configured': model is not None,
        'available_models': available_models
    })

if __name__ == '__main__':
    print("Servidor Gemini iniciando en http://localhost:5001")
    print(f"Gemini AI: {'Configurado' if model else 'Error'}")
    app.run(debug=True, host='localhost', port=5001)