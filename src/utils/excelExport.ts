import * as XLSX from 'xlsx';
import { SurveyResponse } from '../types';

export const exportSurveyDataToExcel = (surveyResponses: SurveyResponse[], fileName: string) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define all questions with their field names
    const questionMapping = [
      // I. Preguntas Generales
      { field: 'gender', question: '1. ¿Con cuál género te identificas?' },
      { field: 'disability', question: '2. ¿Presentas alguna discapacidad?' },
      { field: 'disabilityType', question: '2a. Si tu respuesta anterior fue "Sí", ¿qué tipo de discapacidad presentas?' },
      { field: 'absenceDays', question: '3. En el último mes... ¿cuántos días completos has faltado al colegio por cualquier razón?' },
      
      // II. Experiencia en el Establecimiento
      { field: 'happyAtSchool', question: '4. ¿Estás feliz de estar en este colegio?' },
      { field: 'feelPartOfSchool', question: '5. ¿Sientes que eres parte de este colegio?' },
      { field: 'generalExperience', question: '6. ¿Cómo describirías tu experiencia general en el colegio?' },
      { field: 'participationOpportunity', question: '7. ¿El colegio te ha dado anteriormente la oportunidad de participar y de dar ideas para mejorar la calidad del ambiente educacional?' },
      { field: 'extracurricularActivities', question: '8. Las actividades extracurriculares ofrecidas por el colegio son variadas y atractivas' },
      { field: 'learningMotivation', question: '9. ¿Te sientes motivado/a y comprometido/a con tu proceso de aprendizaje en el colegio?' },
      { field: 'teacherCare', question: '10. ¿Sientes que tus profesores se preocupan por tu bienestar y desarrollo académico?' },
      { field: 'socialSpace', question: '11. ¿Tienes espacio suficiente para jugar, correr y hacer vida social en el colegio?' },
      
      // III. Seguridad y Bullying
      { field: 'schoolSafety', question: '12. ¿Te sientes seguro en el colegio?' },
      { field: 'respectTeaching', question: '13. ¿Tu colegio enseña a los estudiantes a tratarse con respeto?' },
      { field: 'conflictResolution', question: '14. ¿Tu colegio ayuda a los estudiantes a resolver sus conflictos?' },
      { field: 'bullyingProblem', question: '15. ¿Consideras que el Bullying es un problema en tu colegio?' },
      { field: 'rumorsSpread', question: '16. Durante este semestre... ¿Se han difundido rumores malos o mentiras sobre ti?' },
      { field: 'offensiveNames', question: '17. Durante este semestre... ¿Te han llamado por nombres molestos o te hacen bromas ofensivas?' },
      { field: 'physicalAggression', question: '18. Durante este semestre... ¿Te han golpeado o te empujado en la escuela sin estar jugando?' },
      { field: 'appearanceMocking', question: '19. Durante este semestre... ¿Se han burlado de ti por tu apariencia?' },
      { field: 'weaponSeen', question: '20. Durante este semestre... ¿Viste a otro niño con un cuchillo, una navaja o un arma blanca?' },
      
      // IV. Salud Mental
      { field: 'stressFrequency', question: '21. Durante este semestre... ¿Qué tan seguido te has sentido estresado?' },
      { field: 'sadnessFrequency', question: '22. Durante este semestre... ¿Qué tan seguido te has sentido triste?' },
      { field: 'lonelinessFrequency', question: '23. Durante este semestre... ¿Qué tan seguido te has sentido solo?' },
      { field: 'consideredProfessionalHelp', question: '24. Durante este semestre... ¿Consideraste hablar con algún profesional sobre tus problemas?' },
      { field: 'receivedProfessionalHelp', question: '24a. Si tu respuesta anterior fue "Sí", ¿recibiste ayuda de algún profesional?' },
      { field: 'receivedSchoolProfessionalHelp', question: '24b. Si tu respuesta anterior fue "Sí", ¿recibiste esa ayuda de algún profesional del colegio?' },
      { field: 'professionalHelpWouldHelp', question: '25. ¿Crees que hablarlo con un profesional te ayudaría a mejorar?' },
      { field: 'peersUnderstanding', question: '26. ¿Crees que tus compañeros entenderían tu situación?' },
      { field: 'knowWhereToAskHelp', question: '27. ¿Sabrías dónde y a quién pedirle ayuda dentro del establecimiento?' },
      { field: 'schoolHasNecessaryTools', question: '28. ¿Crees que el colegio cuenta con las herramientas necesarias para ayudar a sus estudiantes en momentos de estrés, tristeza o soledad?' },
      
      // V. Consumo de Alcohol y Drogas
      { field: 'cigarettesHealthBad', question: '29. ¿Crees que fumar cigarros es malo para la salud de una persona?' },
      { field: 'electronicCigarettesHealthBad', question: '30. ¿Crees que fumar cigarros electrónicos es malo para la salud de una persona?' },
      { field: 'marijuanaHealthBad', question: '31. ¿Crees que fumar marihuana es malo para la salud de una persona?' },
      { field: 'excessiveAlcoholHealthBad', question: '32. ¿Crees que tomar alcohol (cerveza, vino, licor) en exceso, es malo para la salud de una persona?' },
      { field: 'alcoholProblemAtSchool', question: '33. ¿Crees que el consumo de alcohol es un problema entre los estudiantes del colegio?' },
      { field: 'drugsProblemAtSchool', question: '34. ¿Crees que el consumo de drogas es un problema entre los estudiantes del colegio?' },
      { field: 'peerPressureSubstances', question: '35. ¿Te sientes presionado/a por tus compañeros para consumir alcohol o drogas?' },
      
      // VI. Limpieza del Establecimiento
      { field: 'cooperateWithCleanliness', question: '36. En general, trato de cooperar con la limpieza del colegio botando mi basura donde corresponde' },
      { field: 'maintainBathroomClean', question: '37. En general, trato de mantener el baño lo más limpio posible' },
      { field: 'peersCareCleanliness', question: '38. En general, considero que mis compañeros se preocupan de la limpieza del colegio' },
      { field: 'classroomCleaningFrequency', question: '39. La limpieza de las salas de clases se realizan con la frecuencia necesaria' },
      { field: 'bathroomCleaningFrequency', question: '40. La limpieza de los baños se realizan con la frecuencia necesaria' },
      { field: 'bathroomHygieneArticles', question: '41. Los baños siempre cuentan con los artículos de higiene necesarios' },
      { field: 'improveFacilitiesCleanliness', question: '42. ¿Crees que se podría mejorar la limpieza de las instalaciones del colegio?' }
    ];
    
    // Prepare data for Excel - each response is a row
    const excelData = surveyResponses.map((response, index) => {
      const row: Record<string, any> = {
        'N° Respuesta': index + 1,
        'ID Respuesta': response.id,
        'Fecha y Hora': new Date(response.timestamp).toLocaleString('es-CL'),
        'Código Colegio': response.schoolCode,
        'Código Encuesta': response.surveyCode,
        'Curso': response.course,
        'Letra': response.letter
      };
      
      // Add all questions as columns
      questionMapping.forEach(({ field, question }) => {
        row[question] = response[field as keyof SurveyResponse] || '';
      });
      
      return row;
    });
    
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-size columns with better width calculation
    const columnWidths: { wch: number }[] = [];
    if (excelData.length > 0) {
      Object.keys(excelData[0]).forEach((key) => {
        let maxLength = key.length; // Start with header length
        
        // Check content length for each row
        excelData.forEach(row => {
          const cellValue = String(row[key] || '');
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });
        
        // Set reasonable limits for column width
        const width = Math.min(Math.max(maxLength + 2, 15), 80);
        columnWidths.push({ wch: width });
      });
      worksheet['!cols'] = columnWidths;
    }
    
    // Style the header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "059669" } }, // Emerald color
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
    
    // Add worksheet to workbook
    const sheetName = 'Respuestas Encuesta';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const finalFileName = `${cleanFileName}_${timestamp}.xlsx`;
    
    // Write and download the file
    XLSX.writeFile(workbook, finalFileName);
    
    return true;
  } catch (error) {
    console.error('Error exporting survey data to Excel:', error);
    throw new Error('Error al exportar los datos a Excel');
  }
};