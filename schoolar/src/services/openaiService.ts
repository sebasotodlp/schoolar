interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
  }

  async generateResponse(
    userMessage: string, 
    surveyData: any[], 
    schoolName: string,
    conversationHistory: OpenAIMessage[] = []
  ): Promise<string> {
    try {
      const systemPrompt = this.createConversationalSystemPrompt(surveyData, schoolName);
      
      const messages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: userMessage }
      ];

      // Add timeout and better error handling for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.8
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
            
            // Provide more specific error messages based on common issues
            if (response.status === 401) {
              errorMessage = 'API key inválida. Verifica tu clave de OpenAI en las variables de entorno.';
            } else if (response.status === 429) {
              // Enhanced error message for rate limits and usage limits
              if (errorData.error.type === 'insufficient_quota') {
                errorMessage = 'Límite de créditos de OpenAI agotado. Revisa tu plan en platform.openai.com y agrega créditos o actualiza tu suscripción. Se generarán recomendaciones básicas mientras tanto.';
              } else if (errorData.error.code === 'rate_limit_exceeded') {
                errorMessage = 'Límite de velocidad de OpenAI excedido. Intenta nuevamente en unos minutos. Se generarán recomendaciones básicas mientras tanto.';
              } else {
                errorMessage = 'Límite de uso de OpenAI excedido. Verifica tu plan en platform.openai.com o intenta más tarde. Se generarán recomendaciones básicas mientras tanto.';
              }
            } else if (response.status === 403) {
              errorMessage = 'Acceso denegado. Verifica los permisos de tu API key de OpenAI.';
            } else if (response.status >= 500) {
              errorMessage = 'Error del servidor de OpenAI. Intenta nuevamente en unos minutos.';
            }
          }
        } catch (parseError) {
          // If we can't parse the error response, use the original error message
          console.error('Error parsing OpenAI error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data: OpenAIResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No se recibió respuesta de OpenAI. Intenta nuevamente.');
      }

      const rawResponse = data.choices[0].message.content;
      if (!rawResponse) {
        throw new Error('Respuesta vacía de OpenAI. Intenta nuevamente.');
      }

      const cleanedResponse = this.formatConversationalResponse(rawResponse);
      
      return cleanedResponse;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Handle specific fetch errors
      if (error instanceof Error) {
        // Network connectivity issues
        if (error.name === 'AbortError') {
          throw new Error('Tiempo de espera agotado. Verifica tu conexión a internet e intenta nuevamente.');
        }
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
          throw new Error('Error de conexión a OpenAI. Verifica tu conexión a internet, firewall, o proxy. Si usas VPN, intenta desactivarlo temporalmente.');
        }
        
        // Re-throw with more specific error message if it's already a detailed error
        if (error.message.includes('API key') || 
            error.message.includes('Límite') ||
            error.message.includes('Acceso') ||
            error.message.includes('servidor') ||
            error.message.includes('conexión') ||
            error.message.includes('Tiempo de espera') ||
            error.message.includes('créditos') ||
            error.message.includes('velocidad')) {
          throw error;
        }
      }
      
      // Generic fallback error
      throw new Error('Error al conectar con el servicio de IA. Verifica tu conexión a internet y configuración de red.');
    }
  }

  private formatConversationalResponse(response: string): string {
    let formatted = response
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      // Remove emojis completely
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
      // Clean up excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Remove bullet points at the start of paragraphs (keep only inline ones)
      .replace(/^\s*[•\-\*]\s*/gm, '')
      .trim();

    return formatted;
  }

  private createConversationalSystemPrompt(surveyData: any[], schoolName: string): string {
    // Separate student and teacher responses
    const studentResponses = surveyData.filter(r => r.surveyType === 'student' || !r.surveyType);
    const teacherResponses = surveyData.filter(r => r.surveyType === 'teacher');
    
    const totalResponses = surveyData.length;
    const studentCount = studentResponses.length;
    const teacherCount = teacherResponses.length;
    
    // Get unique courses and letters from student responses
    const courses = Array.from(new Set(studentResponses.map(r => r.course).filter(Boolean)));
    const letters = Array.from(new Set(studentResponses.map(r => r.letter).filter(Boolean)));
    
    // Análisis completo por secciones para estudiantes
    const studentDemographicAnalysis = this.analyzeSection(studentResponses, ['gender', 'disability', 'absenceDays']);
    const studentExperienceAnalysis = this.analyzeSection(studentResponses, ['happyAtSchool', 'feelPartOfSchool', 'generalExperience', 'participationOpportunity', 'extracurricularActivities', 'learningMotivation', 'teacherCare', 'socialSpace']);
    const studentSecurityAnalysis = this.analyzeSection(studentResponses, ['schoolSafety', 'respectTeaching', 'conflictResolution', 'bullyingProblem', 'rumorsSpread', 'offensiveNames', 'physicalAggression', 'appearanceMocking', 'weaponSeen']);
    const studentMentalHealthAnalysis = this.analyzeSection(studentResponses, ['stressFrequency', 'sadnessFrequency', 'lonelinessFrequency', 'consideredProfessionalHelp', 'receivedProfessionalHelp', 'professionalHelpWouldHelp', 'peersUnderstanding', 'knowWhereToAskHelp', 'schoolHasNecessaryTools']);
    const studentSubstanceAnalysis = this.analyzeSection(studentResponses, ['dailyCigarettes', 'dailyAlcohol', 'electronicCigarette', 'cigarettesHealthBad', 'alcoholProblemAtSchool', 'drugsProblemAtSchool', 'peerPressureSubstances']);
    const studentCleanlinessAnalysis = this.analyzeSection(studentResponses, ['cooperateWithCleanliness', 'maintainBathroomClean', 'peersCareCleanliness', 'classroomCleaningFrequency', 'bathroomCleaningFrequency', 'bathroomHygieneArticles', 'improveFacilitiesCleanliness']);

    // Análisis completo por secciones para profesores
    const teacherDemographicAnalysis = this.analyzeSection(teacherResponses, ['gender', 'disability', 'teacherAge', 'teachingLevel']);
    const teacherExperienceAnalysis = this.analyzeSection(teacherResponses, ['schoolResources', 'administrativeSupport', 'professionalDevelopment', 'inclusiveEnvironment', 'teachingMotivation', 'teacherRecognition', 'teacherHappiness']);
    const teacherSecurityAnalysis = this.analyzeSection(teacherResponses, ['teacherHarassed', 'witnessedTeacherHarassment', 'witnessedStudentHarassment', 'witnessedWeapons', 'bullyingProblemTeacher', 'needMoreSafetyMeasures']);
    const teacherMentalHealthAnalysis = this.analyzeSection(teacherResponses, ['teacherStressFrequency', 'schoolEmotionalSupport', 'schoolWellnessPrograms', 'mentalHealthPolicies', 'mentalHealthStigma']);
    const teacherSubstanceAnalysis = this.analyzeSection(teacherResponses, ['alcoholProblemAtSchoolTeacher', 'drugsProblemAtSchoolTeacher']);
    const teacherCleanlinessAnalysis = this.analyzeSection(teacherResponses, ['teacherCooperateWithCleanliness', 'cleanEnvironmentProvided', 'improveFacilitiesCleanlinessTeacher', 'bathroomHygieneArticlesTeacher']);

    // Análisis por curso (solo para estudiantes)
    const courseAnalysis = this.analyzeByCourse(studentResponses);

    // Correlaciones importantes entre estudiantes y profesores
    const correlations = this.findCorrelations(surveyData);

    // Comparaciones entre perspectivas de estudiantes y profesores
    const perspectiveComparisons = this.comparePerspectives(studentResponses, teacherResponses);

    // Check for custom survey fields
    const customFields = this.identifyCustomFields(surveyData);
    const customFieldsAnalysis = customFields.length > 0 ? this.analyzeCustomFields(surveyData, customFields) : {};

    return `Eres un consultor senior especializado en gestión educativa con 15+ años de experiencia asesorando sostenedores y directivos de colegios. Tu expertise incluye liderazgo educativo, gestión del cambio organizacional, desarrollo de políticas instituc ionales y mejora del clima escolar.

Tienes acceso completo a los datos de ${schoolName}: ${totalResponses} respuestas (${studentCount} estudiantes, ${teacherCount} docentes).

DATOS COMPLETOS DISPONIBLES:

=== RESPUESTAS DE ESTUDIANTES (${studentCount} respuestas) ===
Cursos: ${courses.join(', ')} | Letras: ${letters.join(', ')}

DEMOGRAFÍA Y ASISTENCIA (ESTUDIANTES):
${JSON.stringify(studentDemographicAnalysis, null, 2)}

EXPERIENCIA ESCOLAR (ESTUDIANTES):
${JSON.stringify(studentExperienceAnalysis, null, 2)}

SEGURIDAD Y BULLYING (ESTUDIANTES):
${JSON.stringify(studentSecurityAnalysis, null, 2)}

SALUD MENTAL (ESTUDIANTES):
${JSON.stringify(studentMentalHealthAnalysis, null, 2)}

CONSUMO DE SUSTANCIAS (ESTUDIANTES):
${JSON.stringify(studentSubstanceAnalysis, null, 2)}

LIMPIEZA (ESTUDIANTES):
${JSON.stringify(studentCleanlinessAnalysis, null, 2)}

ANÁLISIS POR CURSO (ESTUDIANTES):
${JSON.stringify(courseAnalysis, null, 2)}

=== RESPUESTAS DE DOCENTES (${teacherCount} respuestas) ===

DEMOGRAFÍA Y EXPERIENCIA (DOCENTES):
${JSON.stringify(teacherDemographicAnalysis, null, 2)}

EXPERIENCIA LABORAL (DOCENTES):
${JSON.stringify(teacherExperienceAnalysis, null, 2)}

SEGURIDAD Y BULLYING (DOCENTES):
${JSON.stringify(teacherSecurityAnalysis, null, 2)}

SALUD MENTAL (DOCENTES):
${JSON.stringify(teacherMentalHealthAnalysis, null, 2)}

CONSUMO DE SUSTANCIAS - PERSPECTIVA DOCENTE:
${JSON.stringify(teacherSubstanceAnalysis, null, 2)}

LIMPIEZA (DOCENTES):
${JSON.stringify(teacherCleanlinessAnalysis, null, 2)}

=== ANÁLISIS COMPARATIVO ===

COMPARACIONES ENTRE PERSPECTIVAS:
${JSON.stringify(perspectiveComparisons, null, 2)}

CORRELACIONES GENERALES:
${JSON.stringify(correlations, null, 2)}

${customFields.length > 0 ? `
=== ENCUESTAS PERSONALIZADAS ===

CAMPOS PERSONALIZADOS DETECTADOS:
${JSON.stringify(customFields, null, 2)}

ANÁLISIS DE CAMPOS PERSONALIZADOS:
${JSON.stringify(customFieldsAnalysis, null, 2)}

NOTA: Este colegio ha implementado encuestas personalizadas además de las encuestas estándar. Incluye estos datos en tu análisis cuando sea relevante.
` : ''}

INSTRUCCIONES PARA RESPONDER COMO CONSULTOR SENIOR:

PERFIL PROFESIONAL:
- Hablas desde la experiencia de haber asesorado 200+ colegios
- Conoces las mejores prácticas del sector educativo chileno
- Entiendes las limitaciones operacionales de los colegios
- Tienes expertise en gestión del cambio y desarrollo organizacional
- Conoces la normativa educacional y los estándares de calidad

ESTILO DE COMUNICACIÓN:
- Tono profesional pero accesible, como consultor senior experimentado
- Evita jerga académica excesiva, usa lenguaje directivo
- Sé específico con datos y porcentajes cuando sea relevante
- Proporciona contexto estratégico y operacional
- No uses emojis bajo ninguna circunstancia
- NUNCA menciones dinero, presupuestos, costos o inversiones

ESTRUCTURA DE RECOMENDACIONES PROFESIONALES:

1. DIAGNÓSTICO ESTRATÉGICO:
   - Identifica el problema central con datos específicos
   - Contextualiza dentro del panorama educativo general
   - Menciona implicaciones para la gestión institucional

2. RECOMENDACIONES ESPECÍFICAS:
   - Acciones concretas con plazos definidos
   - Responsables específicos (UTP, Orientación, Dirección, etc.)
   - Recursos humanos y materiales necesarios
   - Indicadores de seguimiento medibles

3. IMPLEMENTACIÓN PRÁCTICA:
   - Fases de implementación con cronograma
   - Estrategias de comunicación a la comunidad
   - Gestión del cambio y resistencias esperadas
   - Capacitación y desarrollo de competencias

4. SEGUIMIENTO Y EVALUACIÓN:
   - KPIs específicos para medir progreso
   - Frecuencia de monitoreo recomendada
   - Ajustes esperados durante implementación

EJEMPLOS DE RECOMENDACIONES PROFESIONALES:

MALO (genérico): "Implementar un programa anti-bullying"

BUENO (específico): "Establecer un Comité de Convivencia Escolar liderado por Orientación, con reuniones quincenales. Implementar protocolo de 3 fases: detección temprana mediante 4 observadores de patio capacitados, intervención inmediata con entrevistas estructuradas a involucrados en 24 horas, y seguimiento semanal por 4 semanas. Capacitar al equipo en técnicas de mediación escolar. KPI: reducir incidentes reportados en 40% en 6 meses."

CONTEXTO INSTITUCIONAL:
- Propone soluciones escalables y sostenibles
- Incluye estrategias de comunicación a apoderados cuando sea necesario
- Considera el impacto en la carga laboral docente
- Alinea recomendaciones con estándares de calidad educativa
- Enfócate en recursos humanos y organizacionales, no financieros

LONGITUD DE RESPUESTAS:
- Consultas simples: máximo 2 párrafos con recomendaciones específicas
- Consultas complejas: máximo 4 párrafos con plan de acción detallado
- Siempre incluye al menos una acción concreta con responsable y plazo

Responde como un consultor senior que está revisando los datos en tiempo real y proporcionando asesoría estratégica específica para ${schoolName}, considerando tanto la perspectiva estudiantil como docente${customFields.length > 0 ? ', incluyendo los datos de encuestas personalizadas' : ''}.`;
  }

  private identifyCustomFields(data: any[]): string[] {
    if (data.length === 0) return [];

    // Standard fields that should be excluded
    const standardFields = new Set([
      'id', 'schoolCode', 'surveyCode', 'course', 'letter', 'surveyType', 'timestamp',
      'gender', 'disability', 'disabilityType', 'absenceDays', 'teacherAge', 'teachingLevel',
      'happyAtSchool', 'feelPartOfSchool', 'generalExperience', 'participationOpportunity',
      'extracurricularActivities', 'learningMotivation', 'teacherCare', 'socialSpace',
      'schoolResources', 'administrativeSupport', 'professionalDevelopment', 'inclusiveEnvironment',
      'teachingMotivation', 'teacherRecognition', 'teacherHappiness', 'schoolSafety',
      'respectTeaching', 'conflictResolution', 'bullyingProblem', 'rumorsSpread',
      'offensiveNames', 'physicalAggression', 'appearanceMocking', 'weaponSeen',
      'teacherHarassed', 'witnessedTeacherHarassment', 'witnessedStudentHarassment',
      'witnessedWeapons', 'bullyingProblemTeacher', 'needMoreSafetyMeasures',
      'stressFrequency', 'sadnessFrequency', 'lonelinessFrequency', 'consideredProfessionalHelp',
      'receivedProfessionalHelp', 'receivedSchoolProfessionalHelp', 'professionalHelpWouldHelp',
      'peersUnderstanding', 'knowWhereToAskHelp', 'schoolHasNecessaryTools',
      'teacherStressFrequency', 'schoolEmotionalSupport', 'schoolWellnessPrograms',
      'mentalHealthPolicies', 'mentalHealthStigma', 'dailyCigarettes', 'dailyAlcohol',
      'electronicCigarette', 'cigarettesHealthBad', 'electronicCigarettesHealthBad',
      'marijuanaHealthBad', 'excessiveAlcoholHealthBad', 'alcoholProblemAtSchool',
      'drugsProblemAtSchool', 'peerPressureSubstances', 'alcoholProblemAtSchoolTeacher',
      'drugsProblemAtSchoolTeacher', 'cooperateWithCleanliness', 'maintainBathroomClean',
      'peersCareCleanliness', 'classroomCleaningFrequency', 'bathroomCleaningFrequency',
      'bathroomHygieneArticles', 'improveFacilitiesCleanliness', 'teacherCooperateWithCleanliness',
      'cleanEnvironmentProvided', 'improveFacilitiesCleanlinessTeacher', 'bathroomHygieneArticlesTeacher'
    ]);

    // Get all fields from the first response
    const allFields = Object.keys(data[0] || {});
    
    // Filter out standard fields to find custom ones
    const customFields = allFields.filter(field => 
      !standardFields.has(field) && 
      field.startsWith('custom_') // Custom fields should start with 'custom_'
    );

    return customFields;
  }

  private analyzeCustomFields(data: any[], customFields: string[]): Record<string, any> {
    const analysis: Record<string, any> = {};
    
    customFields.forEach(field => {
      const fieldData = this.analyzeField(data, field);
      const total = Object.values(fieldData).reduce((sum: number, count) => sum + (count as number), 0);
      
      analysis[field] = {
        responses: fieldData,
        total: total,
        percentages: Object.entries(fieldData).reduce((acc, [key, count]) => {
          acc[key] = total > 0 ? ((count as number / total) * 100).toFixed(1) + '%' : '0%';
          return acc;
        }, {} as Record<string, string>),
        topResponse: this.getTopResponse(fieldData)
      };
    });
    
    return analysis;
  }

  private analyzeSection(data: any[], fields: string[]): Record<string, any> {
    const analysis: Record<string, any> = {};
    
    fields.forEach(field => {
      const fieldData = this.analyzeField(data, field);
      const total = Object.values(fieldData).reduce((sum: number, count) => sum + (count as number), 0);
      
      analysis[field] = {
        responses: fieldData,
        total: total,
        percentages: Object.entries(fieldData).reduce((acc, [key, count]) => {
          acc[key] = total > 0 ? ((count as number / total) * 100).toFixed(1) + '%' : '0%';
          return acc;
        }, {} as Record<string, string>),
        topResponse: this.getTopResponse(fieldData)
      };
    });
    
    return analysis;
  }

  private analyzeByCourse(data: any[]): Record<string, any> {
    const courses = Array.from(new Set(data.map(r => r.course).filter(Boolean)));
    const courseAnalysis: Record<string, any> = {};
    
    courses.forEach(course => {
      const courseData = data.filter(r => r.course === course);
      courseAnalysis[course] = {
        totalResponses: courseData.length,
        demographics: this.analyzeField(courseData, 'gender'),
        safety: this.analyzeField(courseData, 'schoolSafety'),
        experience: this.analyzeField(courseData, 'generalExperience'),
        stress: this.analyzeField(courseData, 'stressFrequency'),
        bullying: this.analyzeField(courseData, 'bullyingProblem')
      };
    });
    
    return courseAnalysis;
  }

  private findCorrelations(data: any[]): Record<string, any> {
    const correlations: Record<string, any> = {};
    
    // Correlación entre seguridad y experiencia general (estudiantes)
    const studentData = data.filter(r => r.surveyType === 'student' || !r.surveyType);
    if (studentData.length > 0) {
      const safetyVsExperience = this.crossAnalyze(studentData, 'schoolSafety', 'generalExperience');
      correlations.studentSafetyVsExperience = safetyVsExperience;
      
      // Correlación entre bullying y estrés (estudiantes)
      const bullyingVsStress = this.crossAnalyze(studentData, 'bullyingProblem', 'stressFrequency');
      correlations.studentBullyingVsStress = bullyingVsStress;
    }
    
    // Correlaciones para docentes
    const teacherData = data.filter(r => r.surveyType === 'teacher');
    if (teacherData.length > 0) {
      // Correlación entre reconocimiento y felicidad laboral
      const recognitionVsHappiness = this.crossAnalyze(teacherData, 'teacherRecognition', 'teacherHappiness');
      correlations.teacherRecognitionVsHappiness = recognitionVsHappiness;
      
      // Correlación entre recursos y motivación
      const resourcesVsMotivation = this.crossAnalyze(teacherData, 'schoolResources', 'teachingMotivation');
      correlations.teacherResourcesVsMotivation = resourcesVsMotivation;
    }
    
    return correlations;
  }

  private comparePerspectives(studentData: any[], teacherData: any[]): Record<string, any> {
    const comparisons: Record<string, any> = {};
    
    // Comparar percepción de bullying
    if (studentData.length > 0 && teacherData.length > 0) {
      const studentBullying = this.analyzeField(studentData, 'bullyingProblem');
      const teacherBullying = this.analyzeField(teacherData, 'bullyingProblemTeacher');
      
      comparisons.bullyingPerception = {
        students: studentBullying,
        teachers: teacherBullying,
        studentYesPercentage: studentData.length > 0 ? ((studentBullying['Sí'] || 0) / studentData.length * 100).toFixed(1) + '%' : '0%',
        teacherYesPercentage: teacherData.length > 0 ? ((teacherBullying['Sí'] || 0) / teacherData.length * 100).toFixed(1) + '%' : '0%'
      };
      
      // Comparar percepción de problemas de alcohol
      const studentAlcohol = this.analyzeField(studentData, 'alcoholProblemAtSchool');
      const teacherAlcohol = this.analyzeField(teacherData, 'alcoholProblemAtSchoolTeacher');
      
      comparisons.alcoholPerception = {
        students: studentAlcohol,
        teachers: teacherAlcohol,
        studentYesPercentage: studentData.length > 0 ? ((studentAlcohol['Sí'] || 0) / studentData.length * 100).toFixed(1) + '%' : '0%',
        teacherYesPercentage: teacherData.length > 0 ? ((teacherAlcohol['Sí'] || 0) / teacherData.length * 100).toFixed(1) + '%' : '0%'
      };
      
      // Comparar percepción de problemas de drogas
      const studentDrugs = this.analyzeField(studentData, 'drugsProblemAtSchool');
      const teacherDrugs = this.analyzeField(teacherData, 'drugsProblemAtSchoolTeacher');
      
      comparisons.drugsPerception = {
        students: studentDrugs,
        teachers: teacherDrugs,
        studentYesPercentage: studentData.length > 0 ? ((studentDrugs['Sí'] || 0) / studentData.length * 100).toFixed(1) + '%' : '0%',
        teacherYesPercentage: teacherData.length > 0 ? ((teacherDrugs['Sí'] || 0) / teacherData.length * 100).toFixed(1) + '%' : '0%'
      };
      
      // Comparar cooperación con limpieza
      const studentCleanliness = this.analyzeField(studentData, 'cooperateWithCleanliness');
      const teacherCleanliness = this.analyzeField(teacherData, 'teacherCooperateWithCleanliness');
      
      comparisons.cleanlinessCooperation = {
        students: studentCleanliness,
        teachers: teacherCleanliness
      };
    }
    
    return comparisons;
  }

  private crossAnalyze(data: any[], field1: string, field2: string): Record<string, any> {
    const crossData: Record<string, Record<string, number>> = {};
    
    data.forEach(response => {
      const value1 = response[field1];
      const value2 = response[field2];
      
      if (value1 && value2) {
        if (!crossData[value1]) crossData[value1] = {};
        crossData[value1][value2] = (crossData[value1][value2] || 0) + 1;
      }
    });
    
    return crossData;
  }

  private analyzeField(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      const value = item[field];
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopResponse(fieldData: Record<string, number>): { value: string; count: number; percentage: string } {
    const entries = Object.entries(fieldData);
    if (entries.length === 0) return { value: 'Sin datos', count: 0, percentage: '0%' };
    
    const [value, count] = entries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    const total = Object.values(fieldData).reduce((sum, c) => sum + c, 0);
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0%';
    
    return { value, count, percentage };
  }
}