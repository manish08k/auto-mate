const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Workflow extends Model {}

Workflow.init(
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
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { len: [1, 150] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Full canvas JSON — nodes[], edges[], viewport
    definition: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { nodes: [], edges: [], viewport: {} },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    trigger_type: {
      type: DataTypes.ENUM("webhook", "schedule", "manual"),
      allowNull: false,
      defaultValue: "manual",
    },
    // Filled when trigger_type = 'webhook'
    webhook_id: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    // Filled when trigger_type = 'schedule' — cron string e.g. "0 9 * * 1"
    cron_expression: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_run_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_run_status: {
      type: DataTypes.ENUM("success", "failed", "running"),
      allowNull: true,
    },
    run_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "Workflow",
    tableName: "workflows",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["webhook_id"] },
      { fields: ["is_active"] },
    ],
  }
);

module.exports = Workflow;
