import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader, MessageCircle, TrendingUp, AlertCircle, Lightbulb, AlertTriangle, RefreshCw } from 'lucide-react';
import { SurveyResponse, AdminUser } from '../types';
import { OpenAIService } from '../services/openaiService';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AIAgentSectionProps {
  surveyResponses: SurveyResponse[];
  currentUser: AdminUser | null;
}

export function AIAgentSection({ surveyResponses, currentUser }: AIAgentSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [openaiService, setOpenaiService] = useState<OpenAIService | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastDataUpdate, setLastDataUpdate] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages.filter(m => !m.isTyping).length]);

  useEffect(() => {
    try {
      const service = new OpenAIService();
      setOpenaiService(service);
      setApiError(null);
    } catch (error) {
      console.error('Error initializing OpenAI service:', error);
      setApiError('No se pudo inicializar el servicio de IA. Verifica la configuración de la API key.');
    }
  }, []);

  // Calculate total number of unique questions for the current user's school only
  const calculateTotalQuestions = () => {
    if (!currentUser) return 0;

    // Filter survey responses to only include those from the current user's school
    const schoolSurveyResponses = surveyResponses.filter(response => 
      response.schoolCode === currentUser.schoolCode
    );

    // Check if we have any responses for this school
    if (schoolSurveyResponses.length === 0) return 0;

    // Define all possible question fields for both student and teacher surveys
    const studentQuestionFields = [
      // General questions (students) - 4 questions (including conditional)
      'gender', 'disability', 'disabilityType', 'absenceDays',
      
      // Experience questions (students) - 8 questions
      'happyAtSchool', 'feelPartOfSchool', 'generalExperience', 'participationOpportunity',
      'extracurricularActivities', 'learningMotivation', 'teacherCare', 'socialSpace',
      
      // Security questions (students) - 9 questions
      'schoolSafety', 'respectTeaching', 'conflictResolution', 'bullyingProblem',
      'rumorsSpread', 'offensiveNames', 'physicalAggression', 'appearanceMocking', 'weaponSeen',
      
      // Mental health questions (students) - 10 questions (including conditionals)
      'stressFrequency', 'sadnessFrequency', 'lonelinessFrequency', 'consideredProfessionalHelp',
      'receivedProfessionalHelp', 'receivedSchoolProfessionalHelp', 'professionalHelpWouldHelp',
      'peersUnderstanding', 'knowWhereToAskHelp', 'schoolHasNecessaryTools',
      
      // Substance questions (students) - 7 questions
      'cigarettesHealthBad', 'electronicCigarettesHealthBad', 'marijuanaHealthBad',
      'excessiveAlcoholHealthBad', 'alcoholProblemAtSchool', 'drugsProblemAtSchool', 'peerPressureSubstances',
      
      // Cleanliness questions (students) - 7 questions
      'cooperateWithCleanliness', 'maintainBathroomClean', 'peersCareCleanliness',
      'classroomCleaningFrequency', 'bathroomCleaningFrequency', 'bathroomHygieneArticles',
      'improveFacilitiesCleanliness'
    ]; // Total: 45 student questions

    const teacherQuestionFields = [
      // General questions (teachers) - 5 questions (including conditional)
      'gender', 'disability', 'disabilityType', 'teacherAge', 'teachingLevel',
      
      // Experience questions (teachers) - 7 questions
      'schoolResources', 'administrativeSupport', 'professionalDevelopment', 'inclusiveEnvironment',
      'teachingMotivation', 'teacherRecognition', 'teacherHappiness',
      
      // Security questions (teachers) - 6 questions
      'teacherHarassed', 'witnessedTeacherHarassment', 'witnessedStudentHarassment',
      'witnessedWeapons', 'bullyingProblemTeacher', 'needMoreSafetyMeasures',
      
      // Mental health questions (teachers) - 5 questions
      'teacherStressFrequency', 'schoolEmotionalSupport', 'schoolWellnessPrograms',
      'mentalHealthPolicies', 'mentalHealthStigma',
      
      // Substance questions (teachers) - 2 questions
      'alcoholProblemAtSchoolTeacher', 'drugsProblemAtSchoolTeacher',
      
      // Cleanliness questions (teachers) - 4 questions
      'teacherCooperateWithCleanliness', 'cleanEnvironmentProvided',
      'improveFacilitiesCleanlinessTeacher', 'bathroomHygieneArticlesTeacher'
    ]; // Total: 29 teacher questions

    // Check what types of surveys exist for this school
    const hasStudentSurveys = schoolSurveyResponses.some(r => r.surveyType === 'student' || !r.surveyType);
    const hasTeacherSurveys = schoolSurveyResponses.some(r => r.surveyType === 'teacher');

    // Count unique questions based on survey types that exist
    let totalQuestions = 0;
    if (hasStudentSurveys) {
      totalQuestions += studentQuestionFields.length; // 45 questions
    }
    if (hasTeacherSurveys) {
      totalQuestions += teacherQuestionFields.length; // 29 questions
    }

    return totalQuestions;
  };

  // Detectar cambios en los datos de encuestas
  useEffect(() => {
    const currentDataTimestamp = surveyResponses.length > 0 
      ? Math.max(...surveyResponses.map(r => r.timestamp))
      : 0;
    
    if (currentDataTimestamp > lastDataUpdate && isInitialized) {
      setLastDataUpdate(currentDataTimestamp);
      // Notificar al usuario sobre nuevos datos
      addSystemMessage('Datos actualizados: Se han detectado nuevas respuestas de encuestas. El análisis ahora incluye la información más reciente.');
    }
  }, [surveyResponses, lastDataUpdate, isInitialized]);

  useEffect(() => {
    if (!isInitialized && currentUser && surveyResponses.length > 0 && openaiService) {
      initializeChat();
      setIsInitialized(true);
      setLastDataUpdate(surveyResponses.length > 0 
        ? Math.max(...surveyResponses.map(r => r.timestamp))
        : Date.now());
    }
  }, [currentUser, surveyResponses, isInitialized, openaiService]);

  useEffect(() => {
    return () => {
      if (typewriterIntervalRef.current) {
        clearInterval(typewriterIntervalRef.current);
      }
    };
  }, []);

  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: `system-${Date.now()}`,
      type: 'ai',
      content,
      timestamp: new Date(),
      isTyping: false
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const typewriterEffect = (text: string, messageId: string) => {
    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
    }

    const words = text.split(' ');
    let currentText = '';
    let wordIndex = 0;

    typewriterIntervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: currentText, isTyping: true }
            : msg
        ));
        
        wordIndex++;
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: text, isTyping: false }
            : msg
        ));
        
        if (typewriterIntervalRef.current) {
          clearInterval(typewriterIntervalRef.current);
          typewriterIntervalRef.current = null;
        }
        
        setTimeout(() => scrollToBottom(), 200);
      }
    }, 60);
  };

  const generateDataSummary = () => {
    if (surveyResponses.length === 0) return '';

    const courses = Array.from(new Set(surveyResponses.map(r => r.course)));
    const letters = Array.from(new Set(surveyResponses.map(r => r.letter)));
    
    return `Tengo acceso completo a ${surveyResponses.length} respuestas de encuestas de los cursos ${courses.join(', ')} con letras ${letters.join(', ')}. Los datos están actualizados hasta ${new Date().toLocaleString()}.`;
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };

    const dataSummary = generateDataSummary();
    
    const fullWelcomeText = `Hola, soy tu analista de datos educativos.

Estoy aquí para ayudarte a entender qué está pasando en tu colegio basándome en los datos reales de las encuestas. Puedo analizar cualquier aspecto del ambiente escolar, desde la experiencia general de los estudiantes hasta temas específicos como seguridad, salud mental, o limpieza. También puedo comparar entre cursos, identificar patrones y sugerir acciones concretas.

¿Hay algo específico que te gustaría que analice primero?`;

    setMessages([welcomeMessage]);
    
    setTimeout(() => {
      typewriterEffect(fullWelcomeText, welcomeMessage.id);
    }, 500);
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    if (!openaiService) {
      throw new Error('Servicio de IA no disponible');
    }

    const conversationHistory = messages
      .filter(msg => !msg.isTyping)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    return await openaiService.generateResponse(
      userMessage,
      surveyResponses,
      currentUser?.schoolName || 'tu colegio',
      conversationHistory
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !openaiService) return;

    if (typewriterIntervalRef.current) {
      clearInterval(typewriterIntervalRef.current);
      typewriterIntervalRef.current = null;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };

      setMessages(prev => [...prev, aiMessage]);
      
      setTimeout(() => {
        typewriterEffect(aiResponse, aiMessage.id);
      }, 300);

    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };

      const errorText = `Lo siento, hubo un problema al procesar tu consulta. Esto puede deberse a un problema temporal con el servicio de IA, configuración de API key incorrecta, o límite de uso alcanzado.

Por favor, intenta nuevamente en unos momentos. Si el problema persiste, contacta al soporte técnico. Mientras tanto, puedes revisar los datos directamente en la sección de Indicadores.`;

      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        typewriterEffect(errorText, errorMessage.id);
      }, 300);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const refreshData = () => {
    if (surveyResponses.length > 0) {
      const currentTimestamp = Math.max(...surveyResponses.map(r => r.timestamp));
      setLastDataUpdate(currentTimestamp);
      addSystemMessage('Datos actualizados manualmente. Análisis sincronizado con la información más reciente.');
    }
  };

  const quickActions = [
    { label: '¿Cuál es el panorama general del ambiente escolar?', icon: TrendingUp },
    { label: '¿Qué curso necesita más atención?', icon: AlertCircle },
    { label: '¿Cuáles son las 3 prioridades más urgentes?', icon: Lightbulb },
    { label: '¿Cómo está la salud mental de los estudiantes?', icon: AlertTriangle },
    { label: '¿Hay problemas de bullying que deba conocer?', icon: AlertCircle },
    { label: '¿Qué tan satisfechos están los estudiantes?', icon: TrendingUp },
  ];

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se pudo cargar la información del usuario</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de Configuración</h3>
          <p className="text-red-600 mb-4">{apiError}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-red-900 mb-2">Para resolver este problema:</h4>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>Verifica que la variable VITE_OPENAI_API_KEY esté configurada</li>
              <li>Asegúrate de que la API key sea válida</li>
              <li>Recarga la página después de configurar la variable</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Filter survey responses to only include those from the current user's school
  const schoolSurveyResponses = surveyResponses.filter(response => 
    response.schoolCode === currentUser.schoolCode
  );

  // Separate student and teacher responses for display (filtered by school)
  const studentResponses = schoolSurveyResponses.filter(r => r.surveyType === 'student' || !r.surveyType);
  const teacherResponses = schoolSurveyResponses.filter(r => r.surveyType === 'teacher');
  const totalQuestions = calculateTotalQuestions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Agente Online</h2>
            <span className="ml-3 bg-gradient-to-r from-emerald-600 to-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              Inteligencia Artificial
            </span>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center px-3 py-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Asistente conversacional con acceso completo y en tiempo real de las encuestas
        </p>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Analista de Datos Educativos</h3>
            </div>
            <div className="ml-auto">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-100">Conectado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="h-[600px] overflow-y-auto p-6 space-y-6 bg-gray-50"
          style={{ 
            scrollBehavior: 'auto',
            overflowY: 'scroll'
          }}
        >
          {messages.length === 0 && !isInitialized && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Inicializando conversación con datos completos de tu colegio...</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-4xl px-6 py-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.type === 'ai' && (
                    <Bot className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="h-5 w-5 text-white mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                      {message.isTyping && (
                        <span className="inline-block w-2 h-5 bg-emerald-600 ml-1 animate-pulse"></span>
                      )}
                    </div>
                    <div className={`text-xs mt-3 ${
                      message.type === 'user' ? 'text-emerald-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Loader className="h-5 w-5 text-emerald-600 animate-spin" />
                  <span className="text-sm text-gray-600">Analizando datos en tiempo real...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => setInputMessage(action.label)}
                    className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame cualquier cosa sobre los datos de tu colegio..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-sm"
                rows={3}
                disabled={isLoading || !openaiService}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading || !openaiService}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Context Info - Moved below the chat */}
      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
        <div className="flex items-start space-x-3">
          <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-emerald-900 mb-1">Sobre este agente:</h4>
            <p className="text-sm text-emerald-700 mb-2">
              Cuenta con acceso completo a las {schoolSurveyResponses.length} respuestas de encuestas de {currentUser.schoolName}. 
              Puedes preguntarle cualquier cosa como si fuera una persona real analizando los datos.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">{schoolSurveyResponses.length}</div>
                <div className="text-xs text-emerald-600">Respuestas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">
                  {Array.from(new Set(schoolSurveyResponses.map(r => r.course))).length}
                </div>
                <div className="text-xs text-emerald-600">Cursos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">6</div>
                <div className="text-xs text-emerald-600">Áreas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-600">{totalQuestions}</div>
                <div className="text-xs text-emerald-600">Preguntas</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 font-medium">Datos sincronizados</span>
                </div>
                <span className="text-emerald-600">
                  Última actualización: {new Date(lastDataUpdate).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}