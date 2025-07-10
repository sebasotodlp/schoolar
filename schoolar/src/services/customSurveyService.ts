import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CustomSurvey } from '../types';

// Collections
const CUSTOM_SURVEYS_COLLECTION = 'customSurveys';

// Test Firebase connection
const testConnection = async (): Promise<boolean> => {
  try {
    const testQuery = query(collection(db, CUSTOM_SURVEYS_COLLECTION));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.warn('Firebase connection failed:', error);
    return false;
  }
};

// Custom Survey Services
export const saveCustomSurvey = async (surveyData: Omit<CustomSurvey, 'id'>): Promise<string> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      const newSurvey = {
        ...surveyData,
        id: `custom-survey-${Date.now()}`
      };
      localSurveys.push(newSurvey);
      localStorage.setItem('schooly_custom_surveys', JSON.stringify(localSurveys));
      return newSurvey.id;
    }

    const docRef = await addDoc(collection(db, CUSTOM_SURVEYS_COLLECTION), {
      ...surveyData,
      createdAt: Timestamp.fromMillis(surveyData.createdAt),
      lastModified: Timestamp.fromMillis(surveyData.lastModified)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving custom survey:', error);
    // Fallback to local storage
    const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
    const newSurvey = {
      ...surveyData,
      id: `custom-survey-${Date.now()}`
    };
    localSurveys.push(newSurvey);
    localStorage.setItem('schooly_custom_surveys', JSON.stringify(localSurveys));
    return newSurvey.id;
  }
};

export const getCustomSurveysBySchool = async (schoolCode: string): Promise<CustomSurvey[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      return localSurveys.filter((survey: CustomSurvey) => survey.schoolCode === schoolCode);
    }

    // Remove orderBy to avoid composite index requirement
    const q = query(
      collection(db, CUSTOM_SURVEYS_COLLECTION),
      where('schoolCode', '==', schoolCode)
    );
    const querySnapshot = await getDocs(q);
    
    const surveys = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis(),
      lastModified: doc.data().lastModified.toMillis()
    })) as CustomSurvey[];

    // Sort by lastModified in descending order in JavaScript
    return surveys.sort((a, b) => b.lastModified - a.lastModified);
  } catch (error) {
    console.error('Error getting custom surveys by school code:', error);
    // Fallback to local storage
    const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
    return localSurveys.filter((survey: CustomSurvey) => survey.schoolCode === schoolCode);
  }
};

export const updateCustomSurvey = async (surveyData: CustomSurvey): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      const surveyIndex = localSurveys.findIndex((survey: CustomSurvey) => survey.id === surveyData.id);
      
      if (surveyIndex === -1) {
        throw new Error('Encuesta no encontrada');
      }
      
      localSurveys[surveyIndex] = surveyData;
      localStorage.setItem('schooly_custom_surveys', JSON.stringify(localSurveys));
      return;
    }

    await updateDoc(doc(db, CUSTOM_SURVEYS_COLLECTION, surveyData.id), {
      ...surveyData,
      createdAt: Timestamp.fromMillis(surveyData.createdAt),
      lastModified: Timestamp.fromMillis(surveyData.lastModified)
    });
  } catch (error) {
    console.error('Error updating custom survey:', error);
    throw new Error('Error al actualizar la encuesta');
  }
};

export const deleteCustomSurvey = async (surveyId: string): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      const filteredSurveys = localSurveys.filter((survey: CustomSurvey) => survey.id !== surveyId);
      localStorage.setItem('schooly_custom_surveys', JSON.stringify(filteredSurveys));
      return;
    }

    await deleteDoc(doc(db, CUSTOM_SURVEYS_COLLECTION, surveyId));
  } catch (error) {
    console.error('Error deleting custom survey:', error);
    throw new Error('Error al eliminar la encuesta');
  }
};

export const getActiveSurveyByCode = async (surveyCode: string, schoolCode: string): Promise<CustomSurvey | null> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
      return localSurveys.find((survey: CustomSurvey) => 
        survey.surveyCode === surveyCode && 
        survey.schoolCode === schoolCode && 
        survey.isActive
      ) || null;
    }

    const q = query(
      collection(db, CUSTOM_SURVEYS_COLLECTION),
      where('surveyCode', '==', surveyCode),
      where('schoolCode', '==', schoolCode),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis(),
      lastModified: doc.data().lastModified.toMillis()
    } as CustomSurvey;
  } catch (error) {
    console.error('Error getting active survey by code:', error);
    // Fallback to local storage
    const localSurveys = JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
    return localSurveys.find((survey: CustomSurvey) => 
      survey.surveyCode === surveyCode && 
      survey.schoolCode === schoolCode && 
      survey.isActive
    ) || null;
  }
};

export const generateSurveyCode = async (schoolCode: string): Promise<string> => {
  // Generate a unique survey code for the school
  const timestamp = Date.now().toString().slice(-6);
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${schoolCode}-${timestamp}-${randomSuffix}`;
};

// Get all custom surveys for AI integration
export const getAllCustomSurveys = async (): Promise<CustomSurvey[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      return JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
    }

    const querySnapshot = await getDocs(collection(db, CUSTOM_SURVEYS_COLLECTION));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis(),
      lastModified: doc.data().lastModified.toMillis()
    })) as CustomSurvey[];
  } catch (error) {
    console.error('Error getting all custom surveys:', error);
    return JSON.parse(localStorage.getItem('schooly_custom_surveys') || '[]');
  }
};