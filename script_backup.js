class InterviewScriptGenerator {
    constructor() {
        this.formData = {};
        this.generatedScript = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPreviousData();
        this.focusFirstField();
    }
    
    loadPreviousData() {
        try {
            const savedData = localStorage.getItem('interviewFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const element = document.getElementById(key);
                    if (element && data[key]) {
                        element.value = data[key];
                    }
                });
            }
        } catch (e) {
            console.log('No hay datos anteriores para cargar');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('interviewForm');
        const clearBtn = document.getElementById('clearBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const emailBtn = document.getElementById('emailBtn');
        const newScriptBtn = document.getElementById('newScriptBtn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
        
        clearBtn.addEventListener('click', () => this.handleClearForm());
        downloadBtn.addEventListener('click', () => this.handleDownloadPDF());
        emailBtn.addEventListener('click', () => this.handleSendEmail());
        newScriptBtn.addEventListener('click', () => this.handleNewScript());
        
        // Auto-guardar
        const formFields = ['companyName', 'missionVision', 'companyDescription', 'jobPosition', 'jobFunctions', 'technicalSkills', 'softSkills', 'email'];
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.autoSaveFormData());
            }
        });
    }

    focusFirstField() {
        document.getElementById('companyName').focus();
    }
    
    autoSaveFormData() {
        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            missionVision: document.getElementById('missionVision').value.trim(),
            companyDescription: document.getElementById('companyDescription').value.trim(),
            jobPosition: document.getElementById('jobPosition').value.trim(),
            jobFunctions: document.getElementById('jobFunctions').value.trim(),
            technicalSkills: document.getElementById('technicalSkills').value.trim(),
            softSkills: document.getElementById('softSkills').value.trim(),
            email: document.getElementById('email').value.trim()
        };
        localStorage.setItem('interviewFormData', JSON.stringify(formData));
    }

    async handleFormSubmit() {
        if (!this.validateForm()) {
            return;
        }

        this.collectFormData();
        this.showLoading();
        
        try {
            await this.generateScript();
            this.showResults();
        } catch (error) {
            this.hideLoading();
            alert('Error al generar el script: ' + error.message);
        }
    }

    validateForm() {
        const requiredFields = [
            'companyName',
            'companyDescription', 
            'jobPosition',
            'jobFunctions',
            'technicalSkills',
            'softSkills',
            'email'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.focus();
                alert(`Por favor completa el campo: ${field.previousElementSibling.textContent}`);
                return false;
            }
        }

        const email = document.getElementById('email').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            document.getElementById('email').focus();
            alert('Por favor ingresa un correo electrónico válido');
            return false;
        }

        return true;
    }

    collectFormData() {
        this.formData = {
            companyName: document.getElementById('companyName').value.trim(),
            missionVision: document.getElementById('missionVision').value.trim(),
            companyDescription: document.getElementById('companyDescription').value.trim(),
            jobPosition: document.getElementById('jobPosition').value.trim(),
            jobFunctions: document.getElementById('jobFunctions').value.trim(),
            technicalSkills: document.getElementById('technicalSkills').value.trim(),
            softSkills: document.getElementById('softSkills').value.trim(),
            email: document.getElementById('email').value.trim()
        };
        localStorage.setItem('interviewFormData', JSON.stringify(this.formData));
    }

    async generateScript() {
        const prompt = this.buildPrompt();
        
        try {
            const response = await fetch('http://localhost:5001/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.text) {
                this.generatedScript = this.formatGeminiResponse(data.text);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('Error:', error);
            // Usar script de ejemplo si falla
            this.generatedScript = this.generateSampleScript();
        }
    }

    buildPrompt() {
        const { companyName, missionVision, companyDescription, jobPosition, jobFunctions, technicalSkills, softSkills } = this.formData;
        
        let prompt = `Genera un script detallado de entrevista conductual usando el método STAR para contratar el puesto de ${jobPosition} en ${companyName}.`;
        
        if (missionVision) {
            prompt += ` Tomando en cuenta la misión/visión: "${missionVision}"`;
        }
        
        prompt += ` La empresa se describe como: "${companyDescription}".`;
        prompt += ` Las principales funciones del puesto son: "${jobFunctions}".`;
        prompt += ` Las habilidades técnicas requeridas son: "${technicalSkills}".`;
        prompt += ` Las habilidades blandas/aptitudes deseadas son: "${softSkills}".`;
        
        return prompt;
    }

    formatGeminiResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    generateSampleScript() {
        const { companyName, jobPosition } = this.formData;
        
        return `
        <div class="script-header">
            <h3>Script de Entrevista Conductual</h3>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Puesto:</strong> ${jobPosition}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <h3>1. Introducción (5 minutos)</h3>
        <p>Buenos días, gracias por su interés en ${companyName}.</p>

        <h3>2. Preguntas Conductuales - Método STAR</h3>
        <h4>Pregunta 1: Liderazgo</h4>
        <p><strong>Pregunta:</strong> "Cuénteme sobre una situación difícil que tuvo que manejar."</p>
        <p><strong>Qué buscar:</strong> Situación, Tarea, Acción, Resultado</p>

        <h3>3. Cierre</h3>
        <p>¿Tiene alguna pregunta sobre el puesto?</p>
        `;
    }

    showLoading() {
        document.getElementById('loadingSection').classList.remove('hidden');
        document.getElementById('resultSection').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSection').classList.add('hidden');
    }

    showResults() {
        this.hideLoading();
        document.getElementById('scriptContent').innerHTML = this.generatedScript;
        document.getElementById('resultSection').classList.remove('hidden');
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }

    handleClearForm() {
        if (confirm('¿Borrar toda la información?')) {
            document.getElementById('interviewForm').reset();
            localStorage.removeItem('interviewFormData');
            document.getElementById('resultSection').classList.add('hidden');
            this.focusFirstField();
        }
    }

    handleNewScript() {
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('interviewForm').scrollIntoView({ behavior: 'smooth' });
    }

    async handleDownloadPDF() {
        alert('Función de PDF disponible en la versión completa');
    }

    async handleSendEmail() {
        alert('Función de email disponible en la versión completa');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InterviewScriptGenerator();
});