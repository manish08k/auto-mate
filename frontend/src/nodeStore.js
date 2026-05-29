import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow'

const useNodeStore = create(
  devtools((set, get) => ({
    nodes:            [],
    edges:            [],
    selectedNodeId:   null,
    isPanelOpen:      false,

    setNodes:         (nodes) => set({ nodes }),
    setEdges:         (edges) => set({ edges }),

    onNodesChange:    (changes) => set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) })),
    onEdgesChange:    (changes) => set((s) => ({ edges: applyEdgeChanges(changes, s.edges) })),
    onConnect:        (params) => set((s) => ({ edges: addEdge({ ...params, type: 'smoothstep', animated: false }, s.edges) })),

    selectNode:       (id) => set({ selectedNodeId: id, isPanelOpen: !!id }),
    closePanel:       () => set({ selectedNodeId: null, isPanelOpen: false }),

    addNode:          (node) => set((s) => ({ nodes: [...s.nodes, node] })),
    removeNode:       (id)   => set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),

    updateNodeData:   (id, data) => set((s) => ({
      nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
    })),

    reset:            () => set({ nodes: [], edges: [], selectedNodeId: null, isPanelOpen: false }),
  }), { name: 'nodeStore' })
)

export default useNodeStore
