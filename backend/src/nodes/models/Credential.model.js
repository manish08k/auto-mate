const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");
const { encrypt, decrypt } = require("../utils/encrypt");

class Credential extends Model {
  // Decrypt access_token on the fly when reading
  getDecryptedToken() {
    return this.access_token ? decrypt(this.access_token) : null;
  }

  getDecryptedRefreshToken() {
    return this.refresh_token ? decrypt(this.refresh_token) : null;
  }
}

Credential.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false, // user-friendly label e.g. "Work Gmail"
    },
    service: {
      type: DataTypes.ENUM(
        "google",
        "slack",
        "meta",
        "github",
        "telegram",
        "whatsapp",
        "openai",
        "razorpay",
        "custom"
      ),
      allowNull: false,
    },
    auth_type: {
      type: DataTypes.ENUM("oauth2", "api_key", "basic"),
      allowNull: false,
    },
    // AES-256 encrypted at rest
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // For api_key / basic auth — encrypted JSON blob
    // e.g. { apiKey: "..." } or { username: "...", password: "..." }
    secret_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Non-sensitive metadata (scopes, account email shown in UI)
    meta: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Credential",
    tableName: "credentials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["user_id", "service"] },
    ],
    hooks: {
      // Encrypt before every save
      beforeCreate: (cred) => encryptFields(cred),
      beforeUpdate: (cred) => encryptFields(cred),
    },
  }
);

function encryptFields(cred) {
  if (cred.changed("access_token") && cred.access_token) {
    cred.access_token = encrypt(cred.access_token);
  }
  if (cred.changed("refresh_token") && cred.refresh_token) {
    cred.refresh_token = encrypt(cred.refresh_token);
  }
  if (cred.changed("secret_data") && cred.secret_data) {
    const raw =
      typeof cred.secret_data === "object"
        ? JSON.stringify(cred.secret_data)
        : cred.secret_data;
    cred.secret_data = encrypt(raw);
  }
}

module.exports = Credential;
