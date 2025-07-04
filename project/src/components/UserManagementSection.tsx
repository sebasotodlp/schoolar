import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Shield, UserPlus, Settings, CheckCircle, AlertCircle, X } from 'lucide-react';
import { AdminUser, SecondaryUserData, UserPermissions } from '../types';
import { createSecondaryUser, getSecondaryUsersByAdmin, updateSecondaryUser, deleteSecondaryUser } from '../services/firestoreService';

interface UserManagementSectionProps {
  currentUser: AdminUser | null;
}

export function UserManagementSection({ currentUser }: UserManagementSectionProps) {
  const [secondaryUsers, setSecondaryUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<SecondaryUserData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    permissions: {
      indicators: true,
      recommendations: true,
      aiAgent: false,
      surveyManagement: false
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load secondary users on component mount
  useEffect(() => {
    if (currentUser && currentUser.userType === 'admin') {
      loadSecondaryUsers();
    }
  }, [currentUser]);

  const loadSecondaryUsers = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const users = await getSecondaryUsersByAdmin(currentUser.id);
      setSecondaryUsers(users);
    } catch (error) {
      console.error('Error loading secondary users:', error);
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (!editingUser && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'El cargo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) return;

    setLoading(true);
    try {
      if (editingUser) {
        // Update existing user
        const updates: Partial<AdminUser> = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          position: formData.position,
          permissions: formData.permissions
        };

        await updateSecondaryUser(editingUser.id, updates);
        alert('Usuario actualizado exitosamente');
      } else {
        // Create new user
        if (secondaryUsers.length >= 5) {
          alert('Has alcanzado el límite máximo de 5 usuarios secundarios');
          return;
        }

        await createSecondaryUser(
          currentUser.id,
          formData,
          currentUser.schoolCode,
          currentUser.schoolName
        );
        alert('Usuario creado exitosamente');
      }

      // Reset form and reload users
      resetForm();
      await loadSecondaryUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert(error.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '', // Don't pre-fill password for security
      position: user.position || '',
      permissions: user.permissions || {
        indicators: true,
        recommendations: true,
        aiAgent: false,
        surveyManagement: false
      }
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la cuenta de ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteSecondaryUser(user.id);
      alert('Usuario eliminado exitosamente');
      await loadSecondaryUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Error al eliminar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      position: '',
      permissions: {
        indicators: true,
        recommendations: true,
        aiAgent: false,
        surveyManagement: false
      }
    });
    setErrors({});
    setShowCreateForm(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleInputChange = (field: keyof SecondaryUserData, value: string | UserPermissions) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionChange = (permission: keyof UserPermissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  // Check if current user is admin
  if (!currentUser || currentUser.userType !== 'admin') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-500">Solo los administradores pueden acceder a la gestión de usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={secondaryUsers.length >= 5 || loading}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Usuario
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Gestiona las cuentas secundarias de tu colegio ({secondaryUsers.length}/5 usuarios creados)
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Usuarios Secundarios</h3>
        </div>

        {loading && secondaryUsers.length === 0 ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        ) : secondaryUsers.length === 0 ? (
          <div className="p-6 text-center">
            <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios secundarios</h4>
            <p className="text-gray-600 mb-4">Crea tu primer usuario secundario para comenzar a delegar accesos.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Usuario
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {secondaryUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.position}</p>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.permissions?.indicators && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Indicadores
                        </span>
                      )}
                      {user.permissions?.recommendations && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Recomendaciones
                        </span>
                      )}
                      {user.permissions?.aiAgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Agente IA
                        </span>
                      )}
                      {user.permissions?.surveyManagement && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Gestión de Encuestas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="Nombre"
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder="Apellidos"
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="correo@ejemplo.com"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña {editingUser ? '(dejar vacío para mantener actual)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                        errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo en el Colegio *
                  </label>
                  <input
                    type="text"
                    id="position"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 transition-colors ${
                      errors.position ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'
                    }`}
                    placeholder="Ej: Coordinador Académico, Psicólogo, etc."
                    disabled={loading}
                  />
                  {errors.position && (
                    <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                  )}
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permisos de Acceso
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.indicators}
                        onChange={(e) => handlePermissionChange('indicators', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={loading}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Indicadores</span>
                        <p className="text-xs text-gray-600">Acceso a visualizar gráficos y estadísticas de las encuestas</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.recommendations}
                        onChange={(e) => handlePermissionChange('recommendations', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={loading}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Recomendaciones</span>
                        <p className="text-xs text-gray-600">Acceso a generar y exportar recomendaciones basadas en datos</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.aiAgent}
                        onChange={(e) => handlePermissionChange('aiAgent', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={loading}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Agente Online (IA)</span>
                        <p className="text-xs text-gray-600">Acceso al asistente conversacional con inteligencia artificial</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.surveyManagement || false}
                        onChange={(e) => handlePermissionChange('surveyManagement', e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={loading}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Gestión de Encuestas</span>
                        <p className="text-xs text-gray-600">Acceso para crear, editar y gestionar encuestas personalizadas</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* School Info */}
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <h4 className="font-medium text-emerald-900 mb-2">Información del Colegio</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-emerald-700 font-medium">Colegio:</span>
                      <p className="text-emerald-600">{currentUser.schoolName}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium">Código:</span>
                      <p className="text-emerald-600 font-mono">{currentUser.schoolCode}</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingUser ? 'Actualizando...' : 'Creando...'}
                      </div>
                    ) : (
                      editingUser ? 'Actualizar Usuario' : 'Crear Usuario'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Información sobre usuarios secundarios:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Puedes crear hasta 5 usuarios secundarios para tu colegio</li>
              <li>• Cada usuario secundario tendrá acceso solo a los datos de tu colegio ({currentUser.schoolCode})</li>
              <li>• Puedes configurar qué funcionalidades puede usar cada usuario</li>
              <li>• Los usuarios secundarios no pueden crear más usuarios ni acceder a la gestión de usuarios</li>
              <li>• Todas las cuentas secundarias están asociadas a tu cuenta de administrador</li>
              <li>• <strong>Nuevo:</strong> Ahora puedes otorgar permisos para gestionar encuestas personalizadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}