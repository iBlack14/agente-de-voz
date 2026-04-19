require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const data = [
    {
        id: 'actualizaciones_marketing',
        name: 'ACTUALIZACIONES',
        greeting: 'Somos la agencia de marketing y publicidad. Via Comunicativa,',
        text: 'Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificación, pueden comunicarse directamente al número: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.'
    },
    {
        id: 'renovacion_web',
        name: 'RENOVACON',
        greeting: 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA.',
        text: 'Tenemos a cargo su servicio web dominio... Está próximo a vencer, se le recomienda realizar el pago por renovación de s/.250.00 al haber cumplido ya un año con nosotros, evitar cortes e interrupciones y pagos por reposición de servicio. Quedamos Atentos.'
    },
    {
        id: 'uso_correos',
        name: 'USO DE CORREOS',
        greeting: '',
        text: 'Buenas () Estimado cliente, para garantizar un uso correcto de sus correos corporativos, les recomendamos descargar periodicamente toda su informacion importante a sus computadoras. Esta accion preventiva es vital para evitar perdidas de datos ante cualquier fallo inesperado en los backups. Atentamente, VIA COMUNICATIVA, "Publicidad que marca tu exito".'
    },
    {
        id: 'informacion_pendientes',
        name: 'INFORMACIÓN PENDIENTES',
        greeting: '',
        text: 'Estimado cliente, estamos en la etapa final del proyecto de su desarrollo web ... Para culminar exitosamente el proyecto, solicitamos amablemente el envio de la informacion pendiente. Puede comunicarse directamente con el area de soporte de VIA COMUNICATIVA a los numeros 936613758 o 924461828. Esperamos su pronta respuesta para culminar el servicio exitosamente. Estamos listos para lanzar su proyecto al mercado hoy mismo. Quedamos atentos.'
    },
    {
        id: 'respuesta_cotizacion',
        name: 'RESPUESTA DE COTIZACIÓN',
        greeting: '',
        text: 'Buenos Dias, Estimado cliente, le enviamos una cotizacion para el desarrollo de su servicio web, esperamos su verificacion tecnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el numero principal de nuestra empresa. 936613758. VIA COMUNICATIVA, "Publicidad que marca tu exito".'
    },
    {
        id: 'renovacion_servicios',
        name: 'RENOVACIÓN DE SERVICIOS',
        greeting: 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA.',
        text: 'Tenemos a cargo su servicio web dominio... Esta proximo a vencer, se le recomienda realizar el pago por renovacion de s/.250.00 al haber cumplido ya un ano con nosotros, evitar cortes e interrupciones y pagos por reposicion de servicio. Quedamos Atentos.'
    },
    {
        id: 'actualizacion_datos',
        name: 'ACTUALIZACIÓN DE DATOS',
        greeting: 'Somos la agencia de marketing y publicidad. Via Comunicativa,',
        text: 'Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificacion, pueden comunicarse directamente al numero: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.'
    },
    {
        id: '1776454945211',
        name: 'RESPUESTA DE COTIZACIÓN',
        greeting: '',
        text: 'Buenos Días, Estimado cliente, le enviamos una cotización para el desarrollo de su servicio web, esperamos su verificación técnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el número principal de nuestra empresa. 936613758 VIA COMUNICATIVA, "Publicidad que marca tu éxito".'
    },
    {
        id: 'llamada_ofertas',
        name: 'LLAMADA DE OFERTAS',
        greeting: '',
        text: 'Estimado cliente, impulsa tu empresa aumentando la rentabilidad y utilidades con nuestras paginas web profesionales, reestructuraciones y sistemas ERP empresariales. Te entregamos soluciones tecnologicas de excelencia, disenadas para automatizar procesos y escalar tus ventas rapidamente, manteniendo una inversion accesible. Moderniza tu presencia digital y asegura resultados comerciales. Somos VIA COMUNICATIVA - Agencia de Marketing y Publicidad. Puedes comunicarte al: 936613758.'
    },
    {
        id: '1776454908456',
        name: 'NUEVO AGENTE',
        greeting: '',
        text: 'Estimado cliente, en VIA COMUNICATIVA - Agencia de Marketing y Publicidad hemos habilitado nuestro nuevo agente de atención directa: 051 146 824 21. Gestionaremos llamadas rápidas de información sobre actualizaciones, soporte de correos corporativos, análisis, estrategias y fechas de renovación de sus servicios. Registrar el número telefónico para mantenerse informado. Gracias.'
    },
    {
        id: '1776454815588',
        name: 'COBRO POR FECHA',
        greeting: '',
        text: 'Estimado cliente, la renovación de su servicio web anual, tiene fecha límite de pago, el día 18 de abril del 2026. Por favor, adjuntar el comprobante enviándolo al número: 936613758. Esto para seguir disfrutando de los beneficios del servicio, y evitar cobros adicionales ante una suspensión temporal. Puede visitarnos en el sitio web: vía comunicativa punto com. Quedamos atentos.'
    }
];

async function run() {
    console.log('🚀 Iniciando carga masiva a Supabase...');
    for (const item of data) {
        const { error } = await supabase.from('reminder_prompts').upsert(item);
        if (error) console.error(`❌ Error en ${item.id}:`, error.message);
        else console.log(`✅ Cargado: ${item.name} (${item.id})`);
    }
    console.log('✨ Carga completada.');
}

run();
