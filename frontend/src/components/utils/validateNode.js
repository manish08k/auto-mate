const REQUIRED_FIELDS = {
  trigger:    ['event'],
  action:     ['service', 'operation'],
  condition:  ['field', 'operator', 'value'],
  transform:  ['expression'],
  delay:      ['duration'],
  webhook:    ['url', 'method'],
  code:       ['script'],
  email:      ['to', 'subject', 'body'],
  http:       ['url', 'method'],
  loop:       ['items'],
};

const VALID_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'exists'];
const VALID_METHODS   = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const validateNode = {
  validate: (node) => {
    const errors = [];
    if (!node) return [{ field: 'node', message: 'Node is required' }];
    if (!node.id) errors.push({ field: 'id', message: 'Node must have an id' });
    if (!node.type) errors.push({ field: 'type', message: 'Node must have a type' });
    if (!node.position?.x == null || node.position?.y == null) {
      errors.push({ field: 'position', message: 'Node must have a valid position' });
    }

    const required = REQUIRED_FIELDS[node.type] ?? [];
    for (const field of required) {
      const val = node.data?.[field];
      if (val === undefined || val === null || val === '') {
        errors.push({ field, message: `${field} is required for ${node.type} nodes` });
      }
    }

    if (node.type === 'condition') {
      if (node.data?.operator && !VALID_OPERATORS.includes(node.data.operator)) {
        errors.push({ field: 'operator', message: `Invalid operator. Must be one of: ${VALID_OPERATORS.join(', ')}` });
      }
    }

    if (node.type === 'webhook' || node.type === 'http') {
      if (node.data?.method && !VALID_METHODS.includes(node.data.method)) {
        errors.push({ field: 'method', message: `Invalid method. Must be one of: ${VALID_METHODS.join(', ')}` });
      }
      if (node.data?.url) {
        try { new URL(node.data.url); }
        catch { errors.push({ field: 'url', message: 'Invalid URL format' }); }
      }
    }

    if (node.type === 'delay') {
      const ms = Number(node.data?.duration);
      if (isNaN(ms) || ms <= 0) {
        errors.push({ field: 'duration', message: 'Duration must be a positive number (ms)' });
      }
    }

    if (node.type === 'code') {
      if (node.data?.script) {
        try { new Function(node.data.script); }
        catch (e) { errors.push({ field: 'script', message: `Syntax error: ${e.message}` }); }
      }
    }

    return errors;
  },

  validateAll: (nodes) => {
    const result = {};
    for (const node of nodes) {
      const errors = validateNode.validate(node);
      if (errors.length > 0) result[node.id] = errors;
    }
    return result; // { [nodeId]: errors[] }
  },

  isValid: (node) => validateNode.validate(node).length === 0,

  isGraphValid: (nodes) => Object.keys(validateNode.validateAll(nodes)).length === 0,

  getErrorSummary: (nodes) => {
    const all = validateNode.validateAll(nodes);
    const count = Object.values(all).reduce((acc, errs) => acc + errs.length, 0);
    const nodeCount = Object.keys(all).length;
    if (count === 0) return null;
    return `${count} error${count !== 1 ? 's' : ''} across ${nodeCount} node${nodeCount !== 1 ? 's' : ''}`;
  },

  getSupportedTypes: () => Object.keys(REQUIRED_FIELDS),

  getRequiredFields: (type) => REQUIRED_FIELDS[type] ?? [],
};

export default validateNode;
