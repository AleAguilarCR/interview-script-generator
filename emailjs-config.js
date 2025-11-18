// Configuración para EmailJS (opcional)
// Para implementar envío real de emails

const EMAIL_CONFIG = {
    serviceId: 'gmail', // Cambiar por tu service ID de EmailJS
    templateId: 'template_interview', // Cambiar por tu template ID
    publicKey: 'YOUR_PUBLIC_KEY', // Cambiar por tu public key de EmailJS
    fromEmail: 'alejandroaguilar1000@gmail.com'
};

// Función para envío real con EmailJS (descomenta para usar)
/*
async function sendEmailWithEmailJS(pdfBlob, formData) {
    // Cargar EmailJS
    if (!window.emailjs) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
        emailjs.init(EMAIL_CONFIG.publicKey);
    }
    
    // Convertir PDF a base64
    const reader = new FileReader();
    const base64PDF = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(pdfBlob);
    });
    
    // Enviar email
    const templateParams = {
        to_email: formData.email,
        from_email: EMAIL_CONFIG.fromEmail,
        company_name: formData.companyName,
        job_position: formData.jobPosition,
        pdf_attachment: base64PDF
    };
    
    return emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, templateParams);
}
*/