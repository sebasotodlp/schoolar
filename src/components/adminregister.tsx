import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Building, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { RegisterData, AdminUser } from '../types';
import { saveAdminUser, checkEmailExists } from '../services/firestoreService';
import { SecureDataManager } from '../config/secureData';

interface AdminRegisterProps {
  onRegister: (user: AdminUser) => void;
}

export function AdminRegister({ onRegister }: AdminRegisterProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    schoolCode: ''
  });

  const [errors, setErrors] = useState<Partial<RegisterData>>({});
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'firebase' | 'local' | 'error'>('checking');
  const [schoolName, setSchoolName] = useState<string>('');

  const secureDataManager = SecureDataManager.getInstance();

  // Test connection on component mount
  useState(() => {
    const testConnection = async () => {
      try {
        await checkEmailExists('test@test.com');
        setConnectionStatus('firebase');
      } catch (error) {
        console.log('Firebase no disponible, usando modo local');
        setConnectionStatus('local');
      }
    };
    testConnection();
  });

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Partial<RegisterData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Los apellidos son requeridos';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.schoolCode.trim()) {
      newErrors.schoolCode = 'El código del colegio es requerido';
    } else {
      // Validate school code using secure manager
      const validation = await secureDataManager.validateSchoolCode(formData.schoolCode.toUpperCase());
      if (!validation.valid) {
        newErrors.schoolCode = 'Código de colegio inválido';
      } else if (validation.name) {
        setSchoolName(validation.name);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      // Intentar usar Firebase primero
      if (connectionStatus === 'firebase') {
        try {
          // Check if email already exists in Firebase
          const emailExists = await checkEmailExists(formData.email);
          if (emailExists) {
            alert('Ya existe una cuenta con este correo electrónico');
            return;
          }

          const newUser: Omit<AdminUser, 'id'> = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            schoolCode: formData.schoolCode.toUpperCase(),
            schoolName: schoolName,
            createdAt: Date.now()
          };

          // Save user to Firestore
          const userId = await saveAdminUser({ ...newUser, password: formData.password });

          // Auto-login the new user
          onRegister({ ...newUser, id: userId });
          return;
        } catch (firebaseError) {
          console.log('Firebase no disponible, usando almacenamiento local:', firebaseError);
          setConnectionStatus('local');
        }
      }

      // Fallback a almacenamiento local
      const existingUsers = JSON.parse(localStorage.getItem('schooly_users') || '[]');
      
      // Verificar si el email ya existe localmente
      if (existingUsers.some((user: any) => user.email.toLowerCase() === formData.email.toLowerCase())) {
        alert('Ya existe una cuenta con este correo electrónico');
        return;
      }

      const newUser: AdminUser = {
        id: `user-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        schoolCode: formData.schoolCode.toUpperCase(),
        schoolName: schoolName,
        createdAt: Date.now()
      };

      existingUsers.push({ ...newUser, password: formData.password });
      localStorage.setItem('schooly_users', JSON.stringify(existingUsers));

      // Auto-login del nuevo usuario
      onRegister(newUser);
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Error al crear la cuenta. Por favor, intenta nuevamente.');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear school name when school code changes
    if (field === 'schoolCode') {
      setSchoolName('');
    }
  };

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'checking':
        return { icon: AlertCircle, text: 'Verificando conexión...', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'firebase':
        return { icon: CheckCircle, text: 'Conectado', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'local':
        return { icon: AlertCircle, text: 'Modo local activo', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'error':
        return { icon: AlertCircle, text: 'Error de conexión', color: 'text-red-600 bg-red-50 border-red-200' };
      default:
        return { icon: AlertCircle, text: 'Estado desconocido', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const statusInfo = getConnectionStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-md mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </button>

        {/* Connection Status */}
        <div className={`mb-6 p-3 rounded-lg border ${statusInfo.color}`}>
          <div className="flex items-center space-x-2">
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{statusInfo.text}</span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registro Admin</h2>
            <p className="text-gray-600">Crea tu cuenta administrativa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Ingresa tu nombre"
                  disabled={loading}
                />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Ingresa tus apellidos"
                  disabled={loading}
                />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* School Code */}
            <div>
              <label htmlFor="schoolCode" className="block text-sm font-medium text-gray-700 mb-2">
                Código del Colegio *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="schoolCode"
                  value={formData.schoolCode}
                  onChange={(e) => handleInputChange('schoolCode', e.target.value.toUpperCase())}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors font-mono text-center ${
                    errors.schoolCode ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="Ej: PRB123"
                  maxLength={10}
                  disabled={loading}
                />
              </div>
              {errors.schoolCode && (
                <p className="mt-1 text-sm text-red-600">{errors.schoolCode}</p>
              )}
              {schoolName && (
                <p className="mt-1 text-sm text-emerald-600">
                  ✓ {schoolName}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/admin/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
                disabled={loading}
              >
                Iniciar Sesión
              </button>
            </p>
          </div>

          {/* Valid Codes Info */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-700 text-left">
              <strong>Nota:</strong><br />
              Para registrarte, es necesario contar con un Código de Colegio.<br />
              Si no posees uno, por favor contacta a Soporte.<br />
            </p>
          </div>

          {/* System Status */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              🔄 Estado del Servidor:<br />
              {connectionStatus === 'firebase' && 'Conectado'}
              {connectionStatus === 'local' && 'Usando almacenamiento local como respaldo'}
              {connectionStatus === 'error' && 'Error de conexión, usando modo local'}
              {connectionStatus === 'checking' && 'Verificando estado de conexión...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}