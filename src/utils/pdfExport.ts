import jsPDF from 'jspdf';

interface RecommendationExportData {
  schoolName: string;
  surveyName: string;
  course: string;
  letter: string;
  totalResponses: number;
  recommendations: any[];
  generatedDate: string;
}

export const exportRecommendationsToPDF = (data: RecommendationExportData) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Set default font to Calibri-like (Helvetica as fallback)
    doc.setFont('helvetica', 'normal');

    // Colors for a clean, professional look
    const colors = {
      primary: [16, 185, 129], // Emerald
      text: [31, 41, 55], // Dark gray
      lightText: [75, 85, 99], // Medium gray
      border: [229, 231, 235], // Light gray
      background: [249, 250, 251] // Very light gray
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Header with school and survey info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.text);
    doc.text(`Informe de Recomendaciones`, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.lightText);
    doc.text(`${data.schoolName}`, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(12);
    doc.text(`${data.surveyName}`, margin, yPosition);
    yPosition += 5;

    // Survey details in a compact format
    doc.setFontSize(10);
    let detailsText = `${data.totalResponses} respuestas`;
    if (data.course !== 'Todos los cursos' && data.course !== 'No aplica') {
      detailsText += ` • ${data.course}`;
    }
    if (data.letter !== 'Todas las letras' && data.letter !== 'No aplica') {
      detailsText += ` ${data.letter}`;
    }
    detailsText += ` • Generado: ${data.generatedDate}`;
    
    doc.text(detailsText, margin, yPosition);
    yPosition += 15;

    // Add a subtle separator line
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Process each recommendation with clean formatting
    data.recommendations.forEach((rec, index) => {
      // Check if we need a new page (estimate 40mm per recommendation)
      checkNewPage(40);

      // Question number and text (bold, larger)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      
      const questionTitle = `Pregunta ${rec.questionNumber}: ${rec.questionText}`;
      const questionLines = doc.splitTextToSize(questionTitle, pageWidth - 2 * margin);
      doc.text(questionLines, margin, yPosition);
      yPosition += questionLines.length * 4 + 5; // Added extra space after question

      // Analysis section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      doc.text('- Análisis:', margin, yPosition);
      yPosition += 5; // Space after "- Análisis:"

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.lightText);
      const analysisLines = doc.splitTextToSize(rec.analysis, pageWidth - 2 * margin - 5);
      doc.text(analysisLines, margin + 5, yPosition);
      yPosition += analysisLines.length * 3.5 + 5; // Added extra space after analysis content

      // Recommendation section
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.text);
      doc.text('- Recomendación:', margin, yPosition);
      yPosition += 5; // Space after "- Recomendación:"

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.lightText);
      const recommendationLines = doc.splitTextToSize(rec.recommendation, pageWidth - 2 * margin - 5);
      doc.text(recommendationLines, margin + 5, yPosition);
      yPosition += recommendationLines.length * 3.5 + 5; // Added extra space after recommendation content

      // Add subtle separator between recommendations (except for the last one)
      if (index < data.recommendations.length - 1) {
        yPosition += 3; // Additional space before separator
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.2);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
      } else {
        yPosition += 10;
      }
    });

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Page number
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.lightText);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      
      // Footer text on first page
      if (i === 1) {
        doc.text('Generado por schoolar.cl', margin, pageHeight - 10);
      }
    }

    // Save the PDF with a clean filename
    const cleanSchoolName = data.schoolName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const cleanSurveyName = data.surveyName.split(' - ')[0].replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const fileName = `Recomendaciones_${cleanSchoolName}_${cleanSurveyName}_${data.generatedDate.replace(/\//g, '-')}.pdf`;
    
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Error al generar el PDF');
  }
};