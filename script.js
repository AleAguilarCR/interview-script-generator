class InterviewScriptGenerator {
    constructor() {
        this.formData = {};
        this.generatedScript = '';
        this.logoDataURL = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPreviousData();
        this.focusFirstField();
        this.preloadLogo();
    }
    
    loadPreviousData() {
        try {
            const savedData = localStorage.getItem('interviewFormData');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Cargar automáticamente los datos sin preguntar
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

        const newScriptBtn = document.getElementById('newScriptBtn');

        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', async (e) => {
            console.log('Botón clickeado');
            await this.handleFormSubmit(e);
        });
        clearBtn.addEventListener('click', () => this.handleClearForm());
        downloadBtn.addEventListener('click', async () => await this.handleDownloadPDF());

        newScriptBtn.addEventListener('click', () => this.handleNewScript());
        
        // Auto-guardar datos mientras el usuario escribe
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

        // Validar email
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
        
        // Guardar en localStorage inmediatamente
        localStorage.setItem('interviewFormData', JSON.stringify(this.formData));
    }

    async generateScript() {
        const prompt = this.buildPrompt();
        
        try {
            // Llamar directamente a la API de Gemini
            const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8000,
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error de Gemini:', errorData);
                throw new Error(`Error ${response.status}: ${errorData.error?.message || 'Error desconocido'}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                this.generatedScript = this.formatGeminiResponse(data.candidates[0].content.parts[0].text);
            } else {
                throw new Error('Respuesta inválida de Gemini');
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
        prompt += ` Las habilidades blandas/aptitudes deseadas son: "${softSkills}".
        
        El script debe incluir:
        1. Introducción y presentación de la empresa
        2. Preguntas conductuales específicas usando el método STAR (Situación, Tarea, Acción, Resultado)
        3. Preguntas técnicas relevantes al puesto
        4. Preguntas sobre habilidades blandas
        5. Preguntas sobre motivación y fit cultural
        6. Cierre y próximos pasos
        
        Cada pregunta debe incluir:
        - La pregunta específica
        - Qué buscar en la respuesta
        - Posibles preguntas de seguimiento
        - Criterios de evaluación
        
        Formato el resultado de manera profesional y estructurada.`;
        
        return prompt;
    }

    async simulateAIResponse() {
        // Simulación de delay de API
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Script de ejemplo generado (en producción esto vendría de Gemini)
        this.generatedScript = this.generateSampleScript();
    }

    formatGeminiResponse(text) {
        // Convertir texto plano de Gemini a HTML formateado
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }
    
    generateSampleScript() {
        const { companyName, jobPosition, missionVision, companyDescription } = this.formData;
        
        return `
        <div class="script-header">
            <h3>Script de Entrevista Conductual</h3>
            <p><strong>Empresa:</strong> ${companyName}</p>
            <p><strong>Puesto:</strong> ${jobPosition}</p>
            <p><strong>Fecha de generación:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <h3>1. Introducción y Presentación (5 minutos)</h3>
        <h4>Saludo y presentación del entrevistador</h4>
        <p>"Buenos días/tardes, mi nombre es [NOMBRE] y soy [CARGO] en ${companyName}. Gracias por su interés en unirse a nuestro equipo."</p>
        
        <h4>Presentación de la empresa</h4>
        <p>"${companyName} es una empresa que ${companyDescription.toLowerCase()}"</p>
        ${missionVision ? `<p>"Nuestra misión y visión se centra en: ${missionVision}"</p>` : ''}
        
        <h4>Estructura de la entrevista</h4>
        <p>"Esta entrevista durará aproximadamente 60 minutos y estará dividida en varias secciones para conocer mejor su experiencia y habilidades."</p>

        <h3>2. Preguntas Conductuales - Método STAR (25 minutos)</h3>
        
        <h4>Pregunta 1: Liderazgo y Toma de Decisiones</h4>
        <p><strong>Pregunta:</strong> "Cuénteme sobre una situación en la que tuvo que tomar una decisión difícil bajo presión. ¿Cómo manejó la situación?"</p>
        <p><strong>Qué buscar:</strong></p>
        <ul>
            <li><strong>Situación:</strong> Contexto claro y específico</li>
            <li><strong>Tarea:</strong> Responsabilidad asumida</li>
            <li><strong>Acción:</strong> Pasos concretos tomados</li>
            <li><strong>Resultado:</strong> Impacto medible y aprendizajes</li>
        </ul>
        <p><strong>Preguntas de seguimiento:</strong> "¿Qué haría diferente?" "¿Cómo afectó esto al equipo?"</p>

        <h4>Pregunta 2: Trabajo en Equipo</h4>
        <p><strong>Pregunta:</strong> "Describa una ocasión en la que tuvo que trabajar con un equipo diverso para alcanzar un objetivo común."</p>
        <p><strong>Qué buscar:</strong> Colaboración, comunicación, resolución de conflictos, adaptabilidad</p>

        <h4>Pregunta 3: Resolución de Problemas</h4>
        <p><strong>Pregunta:</strong> "Hábleme de un problema complejo que haya resuelto en su trabajo anterior. ¿Cuál fue su enfoque?"</p>
        <p><strong>Qué buscar:</strong> Pensamiento analítico, creatividad, persistencia, metodología</p>

        <h3>3. Preguntas Técnicas (15 minutos)</h3>
        <p>Basadas en las habilidades técnicas requeridas para ${jobPosition}:</p>
        <ul>
            <li>Experiencia específica con las tecnologías mencionadas</li>
            <li>Proyectos relevantes realizados</li>
            <li>Desafíos técnicos superados</li>
            <li>Conocimiento de mejores prácticas</li>
        </ul>

        <h3>4. Evaluación de Habilidades Blandas (10 minutos)</h3>
        <h4>Comunicación</h4>
        <p>"¿Cómo explica conceptos técnicos complejos a personas no técnicas?"</p>
        
        <h4>Adaptabilidad</h4>
        <p>"Cuénteme sobre una vez que tuvo que adaptarse rápidamente a un cambio significativo en su trabajo."</p>

        <h3>5. Motivación y Fit Cultural (5 minutos)</h3>
        <p>"¿Qué lo motiva a trabajar en ${companyName}?"</p>
        <p>"¿Cómo se ve contribuyendo a nuestros objetivos empresariales?"</p>

        <h3>6. Cierre y Próximos Pasos</h3>
        <p>"¿Tiene alguna pregunta sobre el puesto o la empresa?"</p>
        <p>"Los próximos pasos en nuestro proceso son..."</p>
        <p>"Estaremos en contacto en los próximos [X] días."</p>

        <h3>Criterios de Evaluación</h3>
        <ul>
            <li><strong>Excelente (4):</strong> Respuestas completas con ejemplos específicos y resultados medibles</li>
            <li><strong>Bueno (3):</strong> Respuestas claras con ejemplos relevantes</li>
            <li><strong>Satisfactorio (2):</strong> Respuestas básicas pero adecuadas</li>
            <li><strong>Insuficiente (1):</strong> Respuestas vagas o irrelevantes</li>
        </ul>

        <h3>Notas del Entrevistador</h3>
        <p>Espacio para observaciones adicionales:</p>
        <div style="border: 1px solid #ddd; height: 100px; margin: 10px 0;"></div>
        `;
    }

    showLoading() {
        document.getElementById('loadingSection').classList.remove('hidden');
        document.getElementById('resultSection').classList.add('hidden');
        
        // Scroll al mensaje de carga
        document.getElementById('loadingSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    async handleFormSubmit(e) {
        console.log('handleFormSubmit ejecutado');
        
        if (!this.validateForm()) {
            console.log('Validación falló');
            return;
        }

        console.log('Validación pasó, generando script...');
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

    hideLoading() {
        document.getElementById('loadingSection').classList.add('hidden');
    }

    showResults() {
        this.hideLoading();
        document.getElementById('scriptContent').innerHTML = this.generatedScript;
        document.getElementById('resultSection').classList.remove('hidden');
        
        // NO ocultar el formulario para mantener los datos visibles
        // document.getElementById('interviewForm').style.display = 'none';
        
        // Scroll to results
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    handleClearForm() {
        if (confirm('¿Está seguro de que desea borrar toda la información ingresada?')) {
            document.getElementById('interviewForm').reset();
            document.getElementById('interviewForm').style.display = 'block';
            document.getElementById('loadingSection').classList.add('hidden');
            document.getElementById('resultSection').classList.add('hidden');
            
            // Limpiar datos guardados
            localStorage.removeItem('interviewFormData');
            
            this.focusFirstField();
        }
    }

    async handleDownloadPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            let currentPage = 1;
            
            // El logo ya está precargado en this.logoDataURL
            
            // 1. Portada elegante
            await this.addPDFCover(pdf);
            
            // 2. Índice (generar después de tener el script)
            pdf.addPage();
            currentPage++;
            await this.addPDFHeader(pdf, currentPage);
            this.addIndex(pdf);
            
            // 3. Script capturado
            const scriptElement = document.getElementById('scriptContent');
            const originalStyle = scriptElement.style.cssText;
            scriptElement.style.cssText = `
                background: white;
                padding: 20px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #000;
                max-height: none;
                overflow: visible;
            `;
            
            const canvas = await html2canvas(scriptElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: scriptElement.scrollWidth,
                height: scriptElement.scrollHeight
            });
            
            scriptElement.style.cssText = originalStyle;
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addPage();
            currentPage++;
            await this.addPDFHeader(pdf, currentPage);
            
            let yPosition = 40;
            const pageHeight = 260; // Aumentado de 250 a 260
            
            if (imgHeight <= pageHeight) {
                pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            } else {
                let currentY = 0;
                const segmentHeight = pageHeight - 20;
                
                while (currentY < imgHeight) {
                    let sliceHeight = Math.min(segmentHeight, imgHeight - currentY);
                    
                    // Si no es la última sección, buscar un buen punto de corte
                    if (currentY + sliceHeight < imgHeight) {
                        // Buscar espacio en blanco en los últimos 40 píxeles
                        const searchRange = 40;
                        let bestCutPoint = sliceHeight;
                        let maxWhiteSpace = 0;
                        
                        for (let offset = 0; offset < searchRange; offset++) {
                            const testY = Math.floor(((currentY + sliceHeight - offset) * canvas.width) / imgWidth);
                            
                            if (testY <= 0 || testY >= canvas.height) continue;
                            
                            // Crear canvas temporal para analizar la línea
                            const testCanvas = document.createElement('canvas');
                            const testCtx = testCanvas.getContext('2d');
                            testCanvas.width = canvas.width;
                            testCanvas.height = 1;
                            
                            testCtx.drawImage(canvas, 0, testY, canvas.width, 1, 0, 0, canvas.width, 1);
                            const imageData = testCtx.getImageData(0, 0, canvas.width, 1);
                            const pixels = imageData.data;
                            
                            // Contar píxeles blancos o casi blancos
                            let whitePixels = 0;
                            for (let i = 0; i < pixels.length; i += 4) {
                                if (pixels[i] > 240 && pixels[i + 1] > 240 && pixels[i + 2] > 240) {
                                    whitePixels++;
                                }
                            }
                            
                            // Si encontramos una línea mayormente blanca, es un buen punto de corte
                            if (whitePixels > maxWhiteSpace) {
                                maxWhiteSpace = whitePixels;
                                bestCutPoint = sliceHeight - offset;
                            }
                            
                            // Si encontramos una línea casi completamente blanca, usar ese punto
                            if (whitePixels > canvas.width * 0.9) {
                                bestCutPoint = sliceHeight - offset;
                                break;
                            }
                        }
                        
                        sliceHeight = bestCutPoint;
                    }
                    
                    const sliceCanvas = document.createElement('canvas');
                    const sliceCtx = sliceCanvas.getContext('2d');
                    const canvasSliceHeight = (sliceHeight * canvas.width) / imgWidth;
                    
                    sliceCanvas.width = canvas.width;
                    sliceCanvas.height = canvasSliceHeight;
                    
                    sliceCtx.drawImage(canvas, 0, (currentY * canvas.width) / imgWidth, 
                                     canvas.width, canvasSliceHeight, 0, 0, 
                                     canvas.width, canvasSliceHeight);
                    
                    const sliceData = sliceCanvas.toDataURL('image/png');
                    pdf.addImage(sliceData, 'PNG', 20, yPosition, imgWidth, sliceHeight);
                    
                    currentY += sliceHeight;
                    
                    if (currentY < imgHeight) {
                        pdf.addPage();
                        currentPage++;
                        await this.addPDFHeader(pdf, currentPage);
                        yPosition = 40;
                    }
                }
            }
            
            // 4. Datos del formulario
            pdf.addPage();
            currentPage++;
            await this.addPDFHeader(pdf, currentPage);
            await this.addFormDataToPDF(pdf, 40);
            
            // Los números de página ya están en el header
            
            pdf.save(`Script_Entrevista_${this.formData.companyName.replace(/\s+/g, '_')}_${this.formData.jobPosition.replace(/\s+/g, '_')}.pdf`);
            
        } catch (error) {
            alert('Error al generar el PDF: ' + error.message);
        }
    }

    async addPDFHeader(pdf, pageNumber = null) {
        // Fondo del header
        pdf.setFillColor(44, 62, 80);
        pdf.rect(0, 0, 210, 25, 'F');
        
        // Intentar agregar el logo real
        if (this.logoDataURL) {
            try {
                pdf.addImage(this.logoDataURL, 'PNG', 11, 9, 13, 13);
            } catch (e) {
                // Fallback si falla
                console.log('Error al agregar logo:', e);
                this.addLogoFallback(pdf, 17.5, 15.5);
            }
        } else {
            // Logo fallback
            this.addLogoFallback(pdf, 17.5, 15.5);
        }
        
        // Información de contacto
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.text('Transformación Digital AA+', 30, 12);
        
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'normal');
        pdf.text('Ing. Alejandro Aguilar MBA', 30, 17);
        pdf.text('alejandroaguilar1000@gmail.com | (+506) 8784-323', 30, 21);
        
        // Fecha y número de página en la esquina derecha
        const fecha = new Date().toLocaleDateString('es-ES');
        if (pageNumber && pageNumber > 1) {
            const totalPages = pdf.internal.getNumberOfPages();
            pdf.text(`Generado: ${fecha} | ${pageNumber - 1}/${totalPages - 1}`, 200, 17, { align: 'right' });
        } else {
            pdf.text(`Generado: ${fecha}`, 200, 17, { align: 'right' });
        }
        
        // Línea separadora
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.5);
        pdf.line(10, 23, 200, 23);
        
        // Resetear colores
        pdf.setTextColor(0, 0, 0);
        pdf.setDrawColor(0, 0, 0);
    }

    addIndex(pdf) {
        // Título del índice
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text('ÍNDICE', 105, 50, { align: 'center' });
        
        // Línea decorativa
        pdf.setDrawColor(52, 152, 219);
        pdf.setLineWidth(1);
        pdf.line(70, 55, 140, 55);
        
        let y = 75;
        
        // Extraer secciones del script generado
        const scriptSections = this.extractScriptSections();
        
        const items = [
            ['Script de Entrevista Conductual', '3']
        ];
        
        // Agregar secciones encontradas o secciones por defecto
        if (scriptSections.length > 0) {
            scriptSections.forEach((section, index) => {
                items.push([`  ${index + 1}. ${section}`, '3']);
            });
        } else {
            const defaultSections = [
                'Introducción y Presentación',
                'Preguntas Conductuales - Método STAR',
                'Preguntas Técnicas',
                'Evaluación de Habilidades Blandas',
                'Motivación y Fit Cultural',
                'Cierre y Próximos Pasos',
                'Criterios de Evaluación'
            ];
            defaultSections.forEach((section, index) => {
                items.push([`  ${index + 1}. ${section}`, '3']);
            });
        }
        
        items.push(['Datos del Formulario', '4+']);
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 0);
        
        items.forEach(([item, page]) => {
            pdf.text(item, 30, y);
            
            // Puntos de relleno
            const itemWidth = pdf.getTextWidth(item);
            const pageWidth = pdf.getTextWidth(page);
            const dotsWidth = 150 - itemWidth - pageWidth;
            const dotsCount = Math.floor(dotsWidth / 2);
            const dots = '.'.repeat(dotsCount);
            
            pdf.text(dots, 30 + itemWidth + 2, y);
            pdf.text(page, 180, y, { align: 'right' });
            
            y += 6;
        });
    }
    
    addLogoFallback(pdf, x, y, radius = 7, fontSize = 8) {
        pdf.setFillColor(255, 255, 255);
        pdf.circle(x, y, radius, 'F');
        pdf.setTextColor(44, 62, 80);
        pdf.setFontSize(fontSize);
        pdf.setFont(undefined, 'bold');
        pdf.text('AA+', x, y + (radius * 0.15), { align: 'center' });
    }
    
    preloadLogo() {
        // No intentar cargar el logo, simplemente usar null
        // Esto hará que siempre use el fallback (texto AA+)
        this.logoDataURL = null;
        console.log('✅ Usando logo fallback (AA+)');
    }
    
    async loadLogoAsDataURL() {
        // Simplemente retornar el logo precargado
        if (this.logoDataURL) {
            console.log('✅ Usando logo precargado');
            return this.logoDataURL;
        }
        console.log('⚠️ Logo no disponible, usando fallback');
        return null;
    }
    
    extractScriptSections() {
        if (!this.generatedScript) {
            console.log('No hay script generado');
            return [];
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.generatedScript;
        
        const sections = [];
        const h3Elements = tempDiv.querySelectorAll('h3');
        
        console.log('H3 elements encontrados:', h3Elements.length);
        
        h3Elements.forEach((h3, index) => {
            const text = h3.textContent.trim();
            console.log(`H3 ${index}:`, text);
            
            // Excluir solo el header principal
            if (text && !text.includes('Script de Entrevista Conductual')) {
                // Limpiar numeración si existe
                const cleanText = text.replace(/^\d+\.\s*/, '');
                sections.push(cleanText);
            }
        });
        
        console.log('Secciones extraídas:', sections);
        return sections;
    }
    
    async addPDFCover(pdf) {
        // Fondo degradado simulado
        pdf.setFillColor(44, 62, 80);
        pdf.rect(0, 0, 210, 100, 'F');
        
        pdf.setFillColor(52, 152, 219);
        pdf.rect(0, 100, 210, 100, 'F');
        
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 200, 210, 97, 'F');
        
        // Intentar agregar el logo real en la portada
        if (this.logoDataURL) {
            try {
                pdf.addImage(this.logoDataURL, 'PNG', 85, 40, 40, 40);
            } catch (e) {
                console.log('Error al agregar logo en portada:', e);
                this.addLogoFallback(pdf, 105, 65, 20, 16);
            }
        } else {
            // Logo fallback en portada
            this.addLogoFallback(pdf, 105, 65, 20, 16);
        }
        
        // Título principal
        pdf.setFontSize(28);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('SCRIPT DE ENTREVISTA', 105, 120, { align: 'center' });
        pdf.text('CONDUCTUAL', 105, 140, { align: 'center' });
        
        // Información de la empresa
        pdf.setFontSize(20);
        pdf.setTextColor(255, 255, 255);
        pdf.text(this.formData.companyName, 105, 170, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.text(`Puesto: ${this.formData.jobPosition}`, 105, 185, { align: 'center' });
        
        // Información adicional en la sección blanca
        pdf.setTextColor(44, 62, 80);
        pdf.setFontSize(12);
        pdf.text(`Generado para: ${this.formData.email}`, 105, 220, { align: 'center' });
        pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 105, 235, { align: 'center' });
        
        // Pie de página
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('Documento confidencial - Solo para uso interno', 105, 280, { align: 'center' });
        pdf.text('Transformación Digital AA+ | alejandroaguilar1000@gmail.com', 105, 290, { align: 'center' });
    }
    
    async addFormDataToPDF(pdf, startY) {
        let y = startY;
        
        // Título de la sección
        pdf.setFillColor(52, 152, 219);
        pdf.rect(10, y, 190, 10, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('DATOS DE ENTRADA DEL FORMULARIO', 105, y + 6, { align: 'center' });
        
        y += 15;
        pdf.setTextColor(0, 0, 0);
        
        const formFields = [
            ['Empresa:', this.formData.companyName],
            ['Puesto:', this.formData.jobPosition],
            ['Correo de contacto:', this.formData.email],
            ['Descripción de la empresa:', this.formData.companyDescription],
            ['Funciones principales:', this.formData.jobFunctions],
            ['Habilidades técnicas:', this.formData.technicalSkills],
            ['Habilidades blandas:', this.formData.softSkills]
        ];
        
        if (this.formData.missionVision) {
            formFields.splice(3, 0, ['Misión/Visión:', this.formData.missionVision]);
        }
        
        formFields.forEach(([label, value]) => {
            // Formato simple y limpio
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(44, 62, 80);
            pdf.text(label, 25, y);
            y += 6;
            
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(0, 0, 0);
            const lines = pdf.splitTextToSize(value, 160);
            pdf.text(lines, 30, y);
            y += lines.length * 4 + 8;
            
            // Línea separadora sutil
            pdf.setDrawColor(220, 220, 220);
            pdf.line(25, y - 2, 185, y - 2);
            y += 6;
            
            if (y > 240) {
                pdf.addPage();
                // Header simple sin await
                pdf.setFillColor(44, 62, 80);
                pdf.rect(0, 0, 210, 25, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(12);
                pdf.text('Datos del Formulario', 105, 15, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
                y = 40;
            }
        });
        
        return y;
    }

    async addScriptToPDF(pdf, startY) {
        let y = startY;
        
        // Título de la sección
        pdf.setFillColor(44, 62, 80);
        pdf.rect(20, y - 5, 170, 12, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('SCRIPT DE ENTREVISTA CONDUCTUAL', 105, y + 2, { align: 'center' });
        
        y += 20;
        pdf.setTextColor(0, 0, 0);
        
        // Procesar el HTML del script
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.generatedScript;
        
        // Extraer elementos estructurados
        const elements = this.parseHTMLForPDF(tempDiv);
        
        elements.forEach(element => {
            // Verificar si necesitamos nueva página con más espacio
            if (y > 255) {
                pdf.addPage();
                // Crear header simple sin await
                pdf.setFillColor(44, 62, 80);
                pdf.rect(0, 0, 210, 25, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(12);
                pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                pdf.setTextColor(0, 0, 0);
                y = 40;
            }
            
            switch (element.type) {
                case 'h3':
                    // Asegurar espacio para el título
                    if (y > 245) {
                        pdf.addPage();
                        pdf.setFillColor(44, 62, 80);
                        pdf.rect(0, 0, 210, 25, 'F');
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(12);
                        pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                        pdf.setTextColor(0, 0, 0);
                        y = 40;
                    }
                    y += 10;
                    pdf.setFontSize(12);
                    pdf.setFont(undefined, 'bold');
                    pdf.setTextColor(44, 62, 80);
                    pdf.text(element.text, 20, y);
                    pdf.line(20, y + 2, 185, y + 2);
                    y += 10;
                    break;
                    
                case 'h4':
                    // Asegurar espacio para subtítulo
                    if (y > 248) {
                        pdf.addPage();
                        pdf.setFillColor(44, 62, 80);
                        pdf.rect(0, 0, 210, 25, 'F');
                        pdf.setTextColor(255, 255, 255);
                        pdf.setFontSize(12);
                        pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                        pdf.setTextColor(0, 0, 0);
                        y = 40;
                    }
                    y += 8;
                    pdf.setFontSize(11);
                    pdf.setFont(undefined, 'bold');
                    pdf.setTextColor(44, 62, 80);
                    pdf.text(element.text, 30, y);
                    y += 8;
                    break;
                    
                case 'p':
                    pdf.setFontSize(9);
                    pdf.setFont(undefined, 'normal');
                    pdf.setTextColor(0, 0, 0);
                    
                    // Procesar diferentes tipos de contenido
                    if (element.text.includes('Pregunta:')) {
                        // Verificar espacio para pregunta completa
                        if (y > 240) {
                            pdf.addPage();
                            pdf.setFillColor(44, 62, 80);
                            pdf.rect(0, 0, 210, 25, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(12);
                            pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                            pdf.setTextColor(0, 0, 0);
                            y = 40;
                        }
                        const parts = element.text.split('Pregunta:');
                        if (parts.length > 1) {
                            // Título "Pregunta" en negrita
                            pdf.setFontSize(11);
                            pdf.setFont(undefined, 'bold');
                            pdf.setTextColor(44, 62, 80);
                            pdf.text('Pregunta:', 30, y);
                            y += 5;
                            
                            // Contenido de la pregunta
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'normal');
                            pdf.setTextColor(0, 0, 0);
                            const questionLines = pdf.splitTextToSize(parts[1].trim(), 150);
                            pdf.text(questionLines, 30, y);
                            y += questionLines.length * 4.5 + 6;
                        }
                    } else if (element.text.includes('Qué buscar:')) {
                        // Verificar espacio antes de iniciar bloque
                        if (y > 240) {
                            pdf.addPage();
                            pdf.setFillColor(44, 62, 80);
                            pdf.rect(0, 0, 210, 25, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(12);
                            pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                            pdf.setTextColor(0, 0, 0);
                            y = 40;
                        }
                        const parts = element.text.split('Qué buscar:');
                        if (parts.length > 1) {
                            // Título "Qué buscar" en negrita
                            pdf.setFontSize(11);
                            pdf.setFont(undefined, 'bold');
                            pdf.setTextColor(44, 62, 80);
                            pdf.text('Qué buscar en la respuesta:', 30, y);
                            y += 5;
                            
                            const content = parts[1].trim();
                            // Procesar elementos STAR como bullets separados
                            if (content.includes('Situación:') || content.includes('Tarea:')) {
                                const starItems = ['Situación:', 'Tarea:', 'Acción:', 'Resultado:'];
                                starItems.forEach(item => {
                                    if (content.includes(item)) {
                                        const itemStart = content.indexOf(item);
                                        const nextItem = starItems.find(next => content.indexOf(next, itemStart + 1) > -1);
                                        const itemEnd = nextItem ? content.indexOf(nextItem, itemStart + 1) : content.length;
                                        let itemText = content.substring(itemStart, itemEnd).trim();
                                        
                                        pdf.setFont(undefined, 'normal');
                                        pdf.setTextColor(0, 0, 0);
                                        pdf.text('•', 50, y);
                                        const itemLines = pdf.splitTextToSize(itemText, 120);
                                        pdf.text(itemLines, 55, y);
                                        y += itemLines.length * 4 + 4;
                                    }
                                });
                            } else {
                                pdf.setFont(undefined, 'normal');
                                pdf.setTextColor(0, 0, 0);
                                const searchLines = pdf.splitTextToSize(content, 150);
                                pdf.text(searchLines, 35, y);
                                y += searchLines.length * 4 + 6;
                            }
                            y += 4;
                        }
                    } else if (element.text.includes('Preguntas de seguimiento:')) {
                        // Verificar espacio antes de iniciar bloque
                        if (y > 245) {
                            pdf.addPage();
                            pdf.setFillColor(44, 62, 80);
                            pdf.rect(0, 0, 210, 25, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(12);
                            pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                            pdf.setTextColor(0, 0, 0);
                            y = 40;
                        }
                        const parts = element.text.split('Preguntas de seguimiento:');
                        if (parts.length > 1) {
                            // Título "Preguntas de seguimiento" en negrita
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'bold');
                            pdf.setTextColor(44, 62, 80);
                            pdf.text('Posibles preguntas de seguimiento:', 35, y);  // Nivel 3
                            y += 6;
                            
                            // Dividir preguntas por comillas y procesarlas como bullets
                            const questions = parts[1].match(/"[^"]+"/g) || [];
                            if (questions.length > 0) {
                                questions.forEach(question => {
                                    pdf.setFont(undefined, 'normal');
                                    pdf.setTextColor(0, 0, 0);
                                    pdf.text('•', 50, y);
                                    const qLines = pdf.splitTextToSize(question.replace(/"/g, ''), 120);
                                    pdf.text(qLines, 55, y);
                                    y += qLines.length * 4 + 4;
                                });
                            } else {
                                // Si no hay comillas, procesar como texto normal
                                pdf.setFont(undefined, 'normal');
                                pdf.setTextColor(0, 0, 0);
                                const followLines = pdf.splitTextToSize(parts[1].trim(), 150);
                                pdf.text(followLines, 35, y);
                                y += followLines.length * 4 + 6;
                            }
                            y += 4;
                        }
                    } else {
                        // Formatear otras secciones con estructura similar
                        const text = element.text;
                        
                        // Procesar texto con bullets
                        if (text.includes('*')) {
                            // Dividir por asteriscos y procesar como bullets
                            const parts = text.split('*').filter(part => part.trim());
                            
                            parts.forEach((part, index) => {
                                const cleanText = part.trim();
                                if (cleanText) {
                                    if (index === 0 && !cleanText.includes(':')) {
                                        // Primer texto sin dos puntos es descripción
                                        pdf.setFontSize(10);
                                        pdf.setFont(undefined, 'normal');
                                        pdf.setTextColor(0, 0, 0);
                                        const lines = pdf.splitTextToSize(cleanText, 160);
                                        pdf.text(lines, 25, y);
                                        y += lines.length * 4 + 6;
                                    } else {
                                        // Es un bullet point
                                        pdf.setFontSize(10);
                                        pdf.setFont(undefined, 'normal');
                                        pdf.setTextColor(0, 0, 0);
                                        pdf.text('•', 45, y);  // Nivel 4
                                        const itemLines = pdf.splitTextToSize(cleanText, 125);
                                        pdf.text(itemLines, 50, y);  // Nivel 4
                                        y += itemLines.length * 4 + 4;
                                    }
                                }
                            });
                        } else if (text.includes('Qué lo motiva') || text.includes('Cómo se ve')) {
                            // Pregunta directa - Nivel 3
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'bold');
                            pdf.setTextColor(44, 62, 80);
                            pdf.text('Pregunta:', 35, y);  // Nivel 3
                            y += 6;
                            pdf.setFont(undefined, 'normal');
                            pdf.setTextColor(0, 0, 0);
                            const questionLines = pdf.splitTextToSize(text, 135);
                            pdf.text(questionLines, 45, y);  // Nivel 4
                            y += questionLines.length * 4 + 8;
                        } else if (text.includes('Comunicación') || text.includes('Adaptabilidad')) {
                            // Subtítulo de habilidad - Nivel 3
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'bold');
                            pdf.setTextColor(44, 62, 80);
                            pdf.text(text, 35, y);  // Nivel 3
                            y += 8;
                        } else {
                            // Texto normal
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, 'normal');
                            pdf.setTextColor(0, 0, 0);
                            const lines = pdf.splitTextToSize(text, 160);
                            pdf.text(lines, 25, y);
                            y += lines.length * 4.5 + 4;
                        }
                    }
                    break;
                    
                case 'ul':
                    element.items.forEach(item => {
                        // Verificar espacio antes de cada bullet
                        if (y > 255) {
                            pdf.addPage();
                            pdf.setFillColor(44, 62, 80);
                            pdf.rect(0, 0, 210, 25, 'F');
                            pdf.setTextColor(255, 255, 255);
                            pdf.setFontSize(12);
                            pdf.text('Script de Entrevista', 105, 15, { align: 'center' });
                            pdf.setTextColor(0, 0, 0);
                            y = 40;
                        }
                        
                        pdf.setFontSize(10);
                        pdf.setFont(undefined, 'normal');
                        pdf.setTextColor(0, 0, 0);
                        
                        // Criterios de evaluación - Nivel 4 (más interno)
                        if (item.includes('Excelente') || item.includes('Bueno') || item.includes('Satisfactorio') || item.includes('Insuficiente')) {
                            pdf.text('•', 50, y);
                            const itemLines = pdf.splitTextToSize(item, 120);
                            pdf.text(itemLines, 55, y);
                            y += itemLines.length * 4 + 5;
                        } else {
                            // Otros bullets
                            pdf.text('•', 35, y);
                            const itemLines = pdf.splitTextToSize(item, 140);
                            pdf.text(itemLines, 40, y);
                            y += itemLines.length * 4.5 + 3;
                        }
                    });
                    y += 6;
                    break;
            }
        });
        
        return y;
    }
    
    parseHTMLForPDF(container) {
        const elements = [];
        const children = container.children;
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const tagName = child.tagName.toLowerCase();
            
            if (tagName === 'h3') {
                elements.push({
                    type: 'h3',
                    text: child.textContent.trim()
                });
            } else if (tagName === 'h4') {
                elements.push({
                    type: 'h4', 
                    text: child.textContent.trim()
                });
            } else if (tagName === 'p') {
                const text = child.textContent.trim();
                if (text && !text.includes('Espacio para observaciones')) {
                    elements.push({
                        type: 'p',
                        text: text
                    });
                }
            } else if (tagName === 'ul') {
                const items = [];
                const listItems = child.getElementsByTagName('li');
                for (let j = 0; j < listItems.length; j++) {
                    const itemText = listItems[j].textContent.trim();
                    if (itemText) {
                        items.push(itemText);
                    }
                }
                if (items.length > 0) {
                    elements.push({
                        type: 'ul',
                        items: items
                    });
                }
            } else if (tagName === 'div' && child.classList.contains('script-header')) {
                // Saltar el header ya que se maneja en la portada
                continue;
            }
        }
        
        return elements;
    }



    handleNewScript() {
        if (confirm('¿Desea generar un nuevo script? Se perderá el script actual.')) {
            // Solo ocultar resultados, mantener formulario visible con datos
            document.getElementById('resultSection').classList.add('hidden');
            document.getElementById('loadingSection').classList.add('hidden');
            
            // Scroll al formulario
            document.getElementById('interviewForm').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new InterviewScriptGenerator();
});