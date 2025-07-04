import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SurveyResponse, AdminUser, SecondaryUserData } from '../types';

// Collections
const SURVEY_RESPONSES_COLLECTION = 'surveyResponses';
const ADMIN_USERS_COLLECTION = 'adminUsers';

// Test Firebase connection
const testConnection = async (): Promise<boolean> => {
  try {
    const testQuery = query(collection(db, ADMIN_USERS_COLLECTION));
    await getDocs(testQuery);
    return true;
  } catch (error) {
    console.warn('Firebase connection failed:', error);
    return false;
  }
};

// Survey Response Services
export const saveSurveyResponse = async (surveyData: Omit<SurveyResponse, 'id'>): Promise<string> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localResponses = JSON.parse(localStorage.getItem('schooly_survey_responses') || '[]');
      const newResponse = {
        ...surveyData,
        id: `local-${Date.now()}`
      };
      localResponses.push(newResponse);
      localStorage.setItem('schooly_survey_responses', JSON.stringify(localResponses));
      return newResponse.id;
    }

    const docRef = await addDoc(collection(db, SURVEY_RESPONSES_COLLECTION), {
      ...surveyData,
      timestamp: Timestamp.fromMillis(surveyData.timestamp)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving survey response:', error);
    // Fallback to local storage
    const localResponses = JSON.parse(localStorage.getItem('schooly_survey_responses') || '[]');
    const newResponse = {
      ...surveyData,
      id: `local-${Date.now()}`
    };
    localResponses.push(newResponse);
    localStorage.setItem('schooly_survey_responses', JSON.stringify(localResponses));
    return newResponse.id;
  }
};

export const getSurveyResponses = async (): Promise<SurveyResponse[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Firebase not available');
    }

    const q = query(
      collection(db, SURVEY_RESPONSES_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toMillis()
    })) as SurveyResponse[];
  } catch (error) {
    console.error('Error getting survey responses:', error);
    throw new Error('Failed to get survey responses');
  }
};

export const getSurveyResponsesBySchoolCode = async (schoolCode: string): Promise<SurveyResponse[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localResponses = JSON.parse(localStorage.getItem('schooly_survey_responses') || '[]');
      return localResponses.filter((response: SurveyResponse) => response.schoolCode === schoolCode);
    }

    const q = query(
      collection(db, SURVEY_RESPONSES_COLLECTION),
      where('schoolCode', '==', schoolCode),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toMillis()
    })) as SurveyResponse[];
  } catch (error) {
    console.error('Error getting survey responses by school code:', error);
    // Fallback to local storage
    const localResponses = JSON.parse(localStorage.getItem('schooly_survey_responses') || '[]');
    return localResponses.filter((response: SurveyResponse) => response.schoolCode === schoolCode);
  }
};

// Admin User Services
export const saveAdminUser = async (userData: Omit<AdminUser, 'id'> & { password: string }): Promise<string> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Firebase not available');
    }

    const docRef = await addDoc(collection(db, ADMIN_USERS_COLLECTION), {
      ...userData,
      createdAt: Timestamp.fromMillis(userData.createdAt)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving admin user:', error);
    throw new Error('Failed to save admin user');
  }
};

export const getAdminUserByEmail = async (email: string): Promise<(AdminUser & { password: string }) | null> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Firebase not available');
    }

    const q = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis()
    } as AdminUser & { password: string };
  } catch (error) {
    console.error('Error getting admin user by email:', error);
    throw new Error('Failed to get admin user');
  }
};

export const updateAdminUserPassword = async (email: string, currentPassword: string, newPassword: string): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      const userIndex = localUsers.findIndex((user: any) => user.email === email);
      
      if (userIndex === -1) {
        throw new Error('Usuario no encontrado');
      }
      
      if (localUsers[userIndex].password !== currentPassword) {
        throw new Error('Contraseña actual incorrecta');
      }
      
      localUsers[userIndex].password = newPassword;
      localStorage.setItem('schooly_users', JSON.stringify(localUsers));
      return;
    }

    // Get user from Firebase
    const q = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Usuario no encontrado');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Verify current password
    if (userData.password !== currentPassword) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    // Update password in Firebase
    await updateDoc(doc(db, ADMIN_USERS_COLLECTION, userDoc.id), {
      password: newPassword
    });
  } catch (error) {
    console.error('Error updating admin user password:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al actualizar la contraseña');
  }
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Check local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      return localUsers.some((user: any) => user.email === email);
    }

    const user = await getAdminUserByEmail(email);
    return user !== null;
  } catch (error) {
    console.error('Error checking if email exists:', error);
    // Check local storage as fallback
    const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
    return localUsers.some((user: any) => user.email === email);
  }
};

// Secondary User Services
export const createSecondaryUser = async (
  adminId: string, 
  userData: SecondaryUserData, 
  schoolCode: string, 
  schoolName: string
): Promise<string> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      
      // Check if email already exists
      if (localUsers.some((user: any) => user.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Ya existe una cuenta con este correo electrónico');
      }
      
      const newUser = {
        id: `secondary-${Date.now()}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        schoolCode,
        schoolName,
        userType: 'secondary',
        createdBy: adminId,
        position: userData.position,
        permissions: userData.permissions,
        createdAt: Date.now()
      };
      
      localUsers.push(newUser);
      localStorage.setItem('schooly_users', JSON.stringify(localUsers));
      return newUser.id;
    }

    // Check if email already exists in Firebase
    const emailExists = await checkEmailExists(userData.email);
    if (emailExists) {
      throw new Error('Ya existe una cuenta con este correo electrónico');
    }

    const newUser = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      schoolCode,
      schoolName,
      userType: 'secondary' as const,
      createdBy: adminId,
      position: userData.position,
      permissions: userData.permissions,
      createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, ADMIN_USERS_COLLECTION), {
      ...newUser,
      createdAt: Timestamp.fromMillis(newUser.createdAt)
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating secondary user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al crear el usuario secundario');
  }
};

export const getSecondaryUsersByAdmin = async (adminId: string): Promise<AdminUser[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      return localUsers.filter((user: any) => user.createdBy === adminId && user.userType === 'secondary');
    }

    // Modified query to avoid composite index requirement
    // Remove orderBy to prevent the need for a composite index
    const q = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('createdBy', '==', adminId),
      where('userType', '==', 'secondary')
    );
    const querySnapshot = await getDocs(q);
    
    // Sort the results in JavaScript instead of using Firestore orderBy
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis()
    })) as AdminUser[];
    
    // Sort by createdAt in descending order (newest first)
    return users.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting secondary users:', error);
    // Fallback to local storage
    const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
    return localUsers.filter((user: any) => user.createdBy === adminId && user.userType === 'secondary');
  }
};

export const updateSecondaryUser = async (userId: string, updates: Partial<AdminUser>): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      const userIndex = localUsers.findIndex((user: any) => user.id === userId);
      
      if (userIndex === -1) {
        throw new Error('Usuario no encontrado');
      }
      
      localUsers[userIndex] = { ...localUsers[userIndex], ...updates };
      localStorage.setItem('schooly_users', JSON.stringify(localUsers));
      return;
    }

    await updateDoc(doc(db, ADMIN_USERS_COLLECTION, userId), updates);
  } catch (error) {
    console.error('Error updating secondary user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al actualizar el usuario');
  }
};

export const deleteSecondaryUser = async (userId: string): Promise<void> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Fallback to local storage
      const localUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      const filteredUsers = localUsers.filter((user: any) => user.id !== userId);
      localStorage.setItem('schooly_users', JSON.stringify(filteredUsers));
      return;
    }

    await deleteDoc(doc(db, ADMIN_USERS_COLLECTION, userId));
  } catch (error) {
    console.error('Error deleting secondary user:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error al eliminar el usuario');
  }
};

// Utility function to get all admin users (for development/debugging)
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Firebase not available');
    }

    const querySnapshot = await getDocs(collection(db, ADMIN_USERS_COLLECTION));
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis()
    })) as AdminUser[];
  } catch (error) {
    console.error('Error getting all admin users:', error);
    throw new Error('Failed to get admin users');
  }
};

// Local storage helpers
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getFromLocalStorage = (key: string): any => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};