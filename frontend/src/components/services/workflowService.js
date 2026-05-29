import api from './api';

const workflowService = {
  getAll: async (params = {}) => {
    const { data } = await api.get('/workflows', { params });
    return data; // { workflows, total, page }
  },

  getById: async (id) => {
    const { data } = await api.get(`/workflows/${id}`);
    return data;
  },

  create: async ({ name, description }) => {
    const { data } = await api.post('/workflows', { name, description, nodes: [], edges: [] });
    return data;
  },

  update: async (id, updates) => {
    const { data } = await api.patch(`/workflows/${id}`, updates);
    return data;
  },

  delete: async (id) => {
    await api.delete(`/workflows/${id}`);
  },

  duplicate: async (id) => {
    const { data } = await api.post(`/workflows/${id}/duplicate`);
    return data;
  },

  saveGraph: async (id, { nodes, edges }) => {
    const { data } = await api.put(`/workflows/${id}/graph`, { nodes, edges });
    return data;
  },

  loadGraph: async (id) => {
    const { data } = await api.get(`/workflows/${id}/graph`);
    return data; // { nodes, edges }
  },

  toggleEnabled: async (id, enabled) => {
    const { data } = await api.patch(`/workflows/${id}`, { enabled });
    return data;
  },

  getVersions: async (id) => {
    const { data } = await api.get(`/workflows/${id}/versions`);
    return data;
  },

  restoreVersion: async (id, versionId) => {
    const { data } = await api.post(`/workflows/${id}/versions/${versionId}/restore`);
    return data;
  },
};

export default workflowService;
