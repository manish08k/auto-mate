import api from './api';

const executionService = {
  run: async (workflowId, payload = {}) => {
    const { data } = await api.post(`/workflows/${workflowId}/run`, payload);
    return data; // { executionId, status }
  },

  getExecution: async (executionId) => {
    const { data } = await api.get(`/executions/${executionId}`);
    return data; // { id, status, startedAt, finishedAt, nodes }
  },

  getExecutions: async (workflowId, params = {}) => {
    const { data } = await api.get(`/workflows/${workflowId}/executions`, { params });
    return data; // { executions, total, page }
  },

  getLogs: async (executionId) => {
    const { data } = await api.get(`/executions/${executionId}/logs`);
    return data; // [{ nodeId, level, message, timestamp }]
  },

  getNodeOutput: async (executionId, nodeId) => {
    const { data } = await api.get(`/executions/${executionId}/nodes/${nodeId}`);
    return data; // { input, output, error, duration }
  },

  cancel: async (executionId) => {
    const { data } = await api.post(`/executions/${executionId}/cancel`);
    return data;
  },

  retry: async (executionId) => {
    const { data } = await api.post(`/executions/${executionId}/retry`);
    return data;
  },

  deleteExecution: async (executionId) => {
    await api.delete(`/executions/${executionId}`);
  },

  streamLogs: (executionId, onMessage, onError) => {
    const url = `${import.meta.env.VITE_API_URL ?? '/api'}/executions/${executionId}/stream`;
    const source = new EventSource(url);
    source.onmessage = (e) => onMessage(JSON.parse(e.data));
    source.onerror = (e) => {
      onError?.(e);
      source.close();
    };
    return () => source.close(); // cleanup fn
  },
};

export default executionService;
