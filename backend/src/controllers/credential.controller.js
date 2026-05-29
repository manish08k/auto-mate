import { apiResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';
import Credential from '../models/Credential.model.js';
import { encrypt, decrypt } from '../utils/encrypt.js';

// GET /credentials
// List all credentials for the authenticated user (never return raw secrets)
export const getCredentials = async (req, res) => {
  try {
    const credentials = await Credential.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'provider', 'type', 'isValid', 'createdAt', 'updatedAt'],
    });

    return res.status(200).json(apiResponse.success('Credentials fetched', credentials));
  } catch (err) {
    logger.error('getCredentials error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch credentials'));
  }
};

// GET /credentials/:id
// Return a single credential — data field is masked
export const getCredential = async (req, res) => {
  try {
    const credential = await Credential.findOne({
      where: { id: req.params.id, userId: req.user.id },
      attributes: ['id', 'name', 'provider', 'type', 'isValid', 'createdAt'],
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('Credential not found'));
    }

    return res.status(200).json(apiResponse.success('Credential fetched', credential));
  } catch (err) {
    logger.error('getCredential error', err);
    return res.status(500).json(apiResponse.error('Failed to fetch credential'));
  }
};

// POST /credentials
// Create a new API key / token credential
// The raw secret is encrypted with AES-256 before storage
export const createCredential = async (req, res) => {
  try {
    const { name, provider, type, data } = req.body;

    // data is the raw secret object e.g. { apiKey: 'sk-...' } or { token: '...' }
    if (!data || typeof data !== 'object') {
      return res.status(400).json(apiResponse.error('Credential data is required'));
    }

    const encryptedData = encrypt(JSON.stringify(data));

    const credential = await Credential.create({
      name,
      provider,     // e.g. 'gmail', 'slack', 'openai'
      type,         // 'oauth' | 'apiKey' | 'basicAuth'
      data: encryptedData,
      isValid: true,
      userId: req.user.id,
    });

    logger.info(`Credential created: ${credential.id} (${provider}) by user ${req.user.id}`);

    return res.status(201).json(
      apiResponse.success('Credential saved', {
        id: credential.id,
        name: credential.name,
        provider: credential.provider,
        type: credential.type,
        isValid: credential.isValid,
        createdAt: credential.createdAt,
      })
    );
  } catch (err) {
    logger.error('createCredential error', err);
    return res.status(500).json(apiResponse.error('Failed to save credential'));
  }
};

// PUT /credentials/:id
// Update name or replace the secret data
export const updateCredential = async (req, res) => {
  try {
    const credential = await Credential.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('Credential not found'));
    }

    const { name, data } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (data && typeof data === 'object') {
      updates.data = encrypt(JSON.stringify(data));
      updates.isValid = true;
    }

    await credential.update(updates);

    logger.info(`Credential updated: ${credential.id}`);

    return res.status(200).json(apiResponse.success('Credential updated'));
  } catch (err) {
    logger.error('updateCredential error', err);
    return res.status(500).json(apiResponse.error('Failed to update credential'));
  }
};

// DELETE /credentials/:id
export const deleteCredential = async (req, res) => {
  try {
    const credential = await Credential.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('Credential not found'));
    }

    await credential.destroy();

    logger.info(`Credential deleted: ${req.params.id}`);

    return res.status(200).json(apiResponse.success('Credential deleted'));
  } catch (err) {
    logger.error('deleteCredential error', err);
    return res.status(500).json(apiResponse.error('Failed to delete credential'));
  }
};

// POST /credentials/:id/test
// Decrypt and do a lightweight API call to verify the credential is still valid
export const testCredential = async (req, res) => {
  try {
    const credential = await Credential.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!credential) {
      return res.status(404).json(apiResponse.error('Credential not found'));
    }

    let decryptedData;
    try {
      decryptedData = JSON.parse(decrypt(credential.data));
    } catch {
      await credential.update({ isValid: false });
      return res.status(422).json(apiResponse.error('Could not decrypt credential — it may be corrupted'));
    }

    // Provider-specific test calls
    let isValid = false;
    let message = '';

    try {
      switch (credential.provider) {
        case 'openai': {
          const r = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${decryptedData.apiKey}` },
          });
          isValid = r.status === 200;
          message = isValid ? 'OpenAI key is valid' : 'OpenAI key rejected';
          break;
        }
        case 'slack': {
          const r = await fetch('https://slack.com/api/auth.test', {
            headers: { Authorization: `Bearer ${decryptedData.token}` },
          });
          const json = await r.json();
          isValid = json.ok === true;
          message = isValid ? 'Slack token is valid' : json.error || 'Slack token rejected';
          break;
        }
        default:
          // Generic — just mark valid if we can decrypt
          isValid = true;
          message = 'Credential decrypted successfully (no live test for this provider)';
      }
    } catch (testErr) {
      isValid = false;
      message = 'Network error during test';
      logger.warn(`Credential test network error: ${testErr.message}`);
    }

    await credential.update({ isValid });

    return res.status(200).json(
      apiResponse.success(message, { isValid })
    );
  } catch (err) {
    logger.error('testCredential error', err);
    return res.status(500).json(apiResponse.error('Test failed'));
  }
};

// Internal helper — used by WorkflowEngine / NodeExecutor to get decrypted data
// NOT exposed as an HTTP route
export const getDecryptedCredential = async (credentialId, userId) => {
  const credential = await Credential.findOne({
    where: { id: credentialId, userId },
  });

  if (!credential) throw new Error(`Credential ${credentialId} not found`);

  const decrypted = JSON.parse(decrypt(credential.data));
  return decrypted;
};
