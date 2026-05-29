import api from './api';

const authService = {
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { user, token }
  },

  register: async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data; // { user, token }
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data; // user object
  },

  updateProfile: async (updates) => {
    const { data } = await api.patch('/auth/me', updates);
    return data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async ({ token, newPassword }) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },
};

export default authService;
