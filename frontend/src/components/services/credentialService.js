import api from './api';

const credentialService = {
  getAll: async () => {
    const { data } = await api.get('/credentials');
    return data; // [{ id, name, type, maskedKey, createdAt, usedIn }]
  },

  getById: async (id) => {
    const { data } = await api.get(`/credentials/${id}`);
    return data;
  },

  create: async ({ name, type, key }) => {
    const { data } = await api.post('/credentials', { name, type, key });
    return data;
  },

  update: async (id, { name, key }) => {
    const { data } = await api.patch(`/credentials/${id}`, { name, key });
    return data;
  },

  delete: async (id) => {
    await api.delete(`/credentials/${id}`);
  },

  test: async (id) => {
    const { data } = await api.post(`/credentials/${id}/test`);
    return data; // { success: boolean, message?: string }
  },

  getTypes: async () => {
    const { data } = await api.get('/credentials/types');
    return data; // [{ type, label, fields }]
  },

  getUsage: async (id) => {
    const { data } = await api.get(`/credentials/${id}/usage`);
    return data; // [{ workflowId, workflowName }]
  },
};

export default credentialService;
