// Configuración segura - Los datos reales deben estar en el backend
export class SecureDataManager {
  private static instance: SecureDataManager;
  private validationCache = new Map<string, boolean>();
  
  private constructor() {}
  
  static getInstance(): SecureDataManager {
    if (!SecureDataManager.instance) {
      SecureDataManager.instance = new SecureDataManager();
    }
    return SecureDataManager.instance;
  }

  // Simulación de validación de códigos (en producción esto debe ser una API)
  async validateSchoolCode(code: string): Promise<{ valid: boolean; name?: string }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // SOLO ESTOS 3 COLEGIOS ESTÁN DISPONIBLES
    const validHashes = new Map([
      ['CSA123', { name: 'Colegio Saucache Arica', hash: 'a1b2c3' }],
      ['CSJ123', { name: 'Colegio San Jorge Arica', hash: 'g7h8i9' }],
      ['PRB123', { name: 'Colegio Prueba', hash: 'j0k1l2' }]
    ]);

    const schoolData = validHashes.get(code);
    if (schoolData) {
      return { valid: true, name: schoolData.name };
    }
    
    return { valid: false };
  }

  async validateSurveyCode(surveyCode: string, schoolCode: string): Promise<{ valid: boolean; name?: string; description?: string; type?: string }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ENCUESTAS PREDETERMINADAS DISPONIBLES
    const validCombinations = new Map([
      // EAE123 para Colegio Saucache Arica (CSA123) - Estudiantes
      ['EAE123-CSA123', { 
        name: 'Encuesta Ambiente Escolar - Estudiantes (Segundo Semestre 2025)', 
        description: 'Evaluación integral del ambiente escolar desde la perspectiva estudiantil - Segundo Semestre 2025', 
        type: 'student' 
      }],
      
      // EAE1234 para Colegio Saucache Arica (CSA123) - Docentes
      ['EAE1234-CSA123', { 
        name: 'Encuesta Ambiente Escolar - Docentes (Segundo Semestre 2025)', 
        description: 'Evaluación del ambiente escolar desde la perspectiva docente - Segundo Semestre 2025', 
        type: 'teacher' 
      }]
    ]);

    const combination = `${surveyCode}-${schoolCode}`;
    const surveyData = validCombinations.get(combination);
    
    if (surveyData) {
      return { valid: true, name: surveyData.name, description: surveyData.description, type: surveyData.type };
    }
    
    // PRIORIDAD 2: Verificar encuestas personalizadas en localStorage (solo para estas escuelas)
    try {
      const customSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      const customSurvey = customSurveys.find((survey: any) => 
        survey.surveyCode === surveyCode && 
        survey.schoolCode === schoolCode && 
        survey.isActive &&
        // SOLO permitir encuestas personalizadas para los colegios autorizados
        ['CSA123', 'CSJ123', 'PRB123'].includes(schoolCode)
      );
      
      if (customSurvey) {
        return { 
          valid: true, 
          name: customSurvey.name, 
          description: customSurvey.description, 
          type: customSurvey.surveyType 
        };
      }
    } catch (error) {
      console.error('Error checking custom surveys in localStorage:', error);
    }

    // PRIORIDAD 3: Verificar encuestas personalizadas en Firestore (solo para colegios autorizados)
    try {
      // Solo verificar en Firestore si es un colegio autorizado
      if (['CSA123', 'CSJ123', 'PRB123'].includes(schoolCode)) {
        const { getActiveSurveyByCode } = await import('../services/customSurveyService');
        const customSurvey = await getActiveSurveyByCode(surveyCode, schoolCode);
        
        if (customSurvey) {
          return { 
            valid: true, 
            name: customSurvey.name, 
            description: customSurvey.description, 
            type: customSurvey.surveyType 
          };
        }
      }
    } catch (error) {
      console.error('Error checking custom surveys in Firestore:', error);
    }
    
    return { valid: false };
  }

  async validateAdminCredentials(email: string, password: string): Promise<{ valid: boolean; user?: any }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // SOLO usar como fallback si Firestore no está disponible
    // El sistema debe usar ÚNICAMENTE las cuentas que existan en Firestore
    // Esta validación es solo para casos de emergencia cuando Firestore no esté disponible
    
    // CUENTAS ADMINISTRATIVAS AUTORIZADAS PARA LOS 3 COLEGIOS
    const validUsers = [
      {
        email: 'ssotod@udd.cl',
        passwordHash: this.simpleHash('0702977'),
        user: {
          id: 'admin-firestore-1',
          firstName: 'Sebastián',
          lastName: 'Soto de la Plaza',
          email: 'ssotod@udd.cl',
          schoolCode: 'CSA123',
          schoolName: 'Colegio Saucache Arica',
          userType: 'admin',
          createdAt: Date.now()
        }
      },
      // Cuenta para Colegio San Jorge Arica
      {
        email: 'admin@csj.cl',
        passwordHash: this.simpleHash('admin123'),
        user: {
          id: 'admin-csj-1',
          firstName: 'Administrador',
          lastName: 'San Jorge',
          email: 'admin@csj.cl',
          schoolCode: 'CSJ123',
          schoolName: 'Colegio San Jorge Arica',
          userType: 'admin',
          createdAt: Date.now()
        }
      },
      // Cuenta para Colegio Prueba
      {
        email: 'admin@prueba.cl',
        passwordHash: this.simpleHash('prueba123'),
        user: {
          id: 'admin-prb-1',
          firstName: 'Administrador',
          lastName: 'Prueba',
          email: 'admin@prueba.cl',
          schoolCode: 'PRB123',
          schoolName: 'Colegio Prueba',
          userType: 'admin',
          createdAt: Date.now()
        }
      }
    ];

    const hashedPassword = this.simpleHash(password);
    const validUser = validUsers.find(u => u.email === email && u.passwordHash === hashedPassword);
    
    if (validUser) {
      return { valid: true, user: validUser.user };
    }
    
    return { valid: false };
  }

  private simpleHash(input: string): string {
    // Hash simple para demo - en producción usar bcrypt o similar
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  // Método para obtener información de escuela sin exponer códigos
  getSchoolDisplayInfo(schoolCode: string): string {
    // Solo retorna información pública para los 3 colegios autorizados
    const publicInfo = new Map([
      ['CSA123', 'Colegio Saucache Arica'],
      ['CSJ123', 'Colegio San Jorge Arica'],
      ['PRB123', 'Colegio Prueba']
    ]);
    
    return publicInfo.get(schoolCode) || 'Colegio no encontrado';
  }

  // Método para obtener todas las encuestas disponibles
  getAvailableSurveys(): Array<{ code: string; name: string; schoolCode: string; schoolName: string; type: string }> {
    return [
      {
        code: 'EAE123',
        name: 'Encuesta Ambiente Escolar - Estudiantes (Segundo Semestre 2025)',
        schoolCode: 'CSA123',
        schoolName: 'Colegio Saucache Arica',
        type: 'student'
      },
      {
        code: 'EAE1234',
        name: 'Encuesta Ambiente Escolar - Docentes (Segundo Semestre 2025)',
        schoolCode: 'CSA123',
        schoolName: 'Colegio Saucache Arica',
        type: 'teacher'
      }
    ];
  }

  // Método para verificar si un colegio está autorizado
  isAuthorizedSchool(schoolCode: string): boolean {
    return ['CSA123', 'CSJ123', 'PRB123'].includes(schoolCode);
  }

  // Método para obtener encuestas disponibles para un colegio específico
  getSurveysForSchool(schoolCode: string): Array<{ code: string; name: string; type: string }> {
    const allSurveys = this.getAvailableSurveys();
    return allSurveys
      .filter(survey => survey.schoolCode === schoolCode)
      .map(survey => ({
        code: survey.code,
        name: survey.name,
        type: survey.type
      }));
  }

  // Método para validar que una encuesta pertenece al colegio correcto
  validateSurveyOwnership(surveyCode: string, schoolCode: string, createdBySchoolCode: string): boolean {
    // Las encuestas predeterminadas tienen asociaciones fijas
    const predefinedSurveys = this.getAvailableSurveys();
    const predefinedSurvey = predefinedSurveys.find(s => s.code === surveyCode);
    
    if (predefinedSurvey) {
      // Para encuestas predeterminadas, verificar que coincida con la asociación correcta
      return predefinedSurvey.schoolCode === schoolCode;
    }
    
    // Para encuestas personalizadas, verificar que el colegio que la creó sea el mismo que la está usando
    return createdBySchoolCode === schoolCode;
  }

  // Método para obtener información de auditoría de encuestas
  getAuditInfo(): { 
    totalSurveys: number; 
    surveysBySchool: Record<string, number>; 
    lastUpdate: string;
    predefinedSurveys: Array<{ code: string; school: string; type: string }>;
  } {
    const surveys = this.getAvailableSurveys();
    const surveysBySchool = surveys.reduce((acc, survey) => {
      acc[survey.schoolCode] = (acc[survey.schoolCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSurveys: surveys.length,
      surveysBySchool,
      lastUpdate: new Date().toISOString(),
      predefinedSurveys: surveys.map(s => ({
        code: s.code,
        school: s.schoolCode,
        type: s.type
      }))
    };
  }

  // Método para verificar si una encuesta es personalizada
  async isCustomSurvey(surveyCode: string, schoolCode: string): Promise<boolean> {
    // Verificar si es una encuesta predeterminada
    const predefinedSurveys = this.getAvailableSurveys();
    const isPredefined = predefinedSurveys.some(s => s.code === surveyCode);
    
    if (isPredefined) {
      return false;
    }

    // Si no es predeterminada, verificar si existe como encuesta personalizada
    try {
      // Verificar en localStorage primero
      const customSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      const localCustomSurvey = customSurveys.find((survey: any) => 
        survey.surveyCode === surveyCode && 
        survey.schoolCode === schoolCode && 
        survey.isActive
      );
      
      if (localCustomSurvey) {
        return true;
      }

      // Verificar en Firestore
      const { getActiveSurveyByCode } = await import('../services/customSurveyService');
      const firestoreCustomSurvey = await getActiveSurveyByCode(surveyCode, schoolCode);
      
      return firestoreCustomSurvey !== null;
    } catch (error) {
      console.error('Error checking if survey is custom:', error);
      return false;
    }
  }
}