import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

export const useNodeStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  clipboard: null,
  history: [],      // undo stack — each entry is { nodes, edges }
  historyIndex: -1, // pointer into history

  // ─── Derived ────────────────────────────────────────────────
  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    return nodes.find((n) => n.id === selectedNodeId) ?? null;
  },

  // ─── ReactFlow handlers ──────────────────────────────────────
  onNodesChange: (changes) => {
    set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge({ ...connection, animated: true }, state.edges),
    }));
  },

  // ─── Node CRUD ───────────────────────────────────────────────
  addNode: (type, position, data = {}) => {
    const id = `node_${Date.now()}`;
    const node = { id, type, position, data: { label: type, ...data } };
    set((state) => {
      const nodes = [...state.nodes, node];
      return { nodes, ...get()._pushHistory(nodes, state.edges) };
    });
    return node;
  },

  updateNode: (id, data) => {
    set((state) => {
      const nodes = state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      );
      return { nodes, ...get()._pushHistory(nodes, state.edges) };
    });
  },

  removeNode: (id) => {
    set((state) => {
      const nodes = state.nodes.filter((n) => n.id !== id);
      const edges = state.edges.filter((e) => e.source !== id && e.target !== id);
      const selectedNodeId = state.selectedNodeId === id ? null : state.selectedNodeId;
      return { nodes, edges, selectedNodeId, ...get()._pushHistory(nodes, edges) };
    });
  },

  duplicateNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return null;
    const newNode = {
      ...node,
      id: `node_${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    };
    set((state) => {
      const nodes = [...state.nodes, newNode];
      return { nodes, ...get()._pushHistory(nodes, state.edges) };
    });
    return newNode;
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  // ─── Clipboard ───────────────────────────────────────────────
  copyNode: (id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (node) set({ clipboard: node });
  },

  pasteNode: (offset = { x: 40, y: 40 }) => {
    const { clipboard } = get();
    if (!clipboard) return null;
    const newNode = {
      ...clipboard,
      id: `node_${Date.now()}`,
      position: {
        x: clipboard.position.x + offset.x,
        y: clipboard.position.y + offset.y,
      },
    };
    set((state) => {
      const nodes = [...state.nodes, newNode];
      return { nodes, ...get()._pushHistory(nodes, state.edges) };
    });
    return newNode;
  },

  // ─── History (undo / redo) ───────────────────────────────────
  _pushHistory: (nodes, edges) => {
    const { history, historyIndex } = get();
    const next = history.slice(0, historyIndex + 1);
    next.push({ nodes, edges });
    return { history: next, historyIndex: next.length - 1 };
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set({ nodes: prev.nodes, edges: prev.edges, historyIndex: historyIndex - 1 });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set({ nodes: next.nodes, edges: next.edges, historyIndex: historyIndex + 1 });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ─── Canvas utils ────────────────────────────────────────────
  clearCanvas: () =>
    set({ nodes: [], edges: [], selectedNodeId: null, history: [], historyIndex: -1 }),

  loadGraph: ({ nodes = [], edges = [] }) =>
    set({ nodes, edges, history: [{ nodes, edges }], historyIndex: 0 }),

  getGraph: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },
}));
