const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Execution extends Model {}

Execution.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workflow_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "workflows", key: "id" },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM("pending", "running", "success", "failed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    trigger_type: {
      type: DataTypes.ENUM("webhook", "schedule", "manual"),
      allowNull: false,
    },
    // Raw payload that started the workflow (webhook body, schedule meta, etc.)
    trigger_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    // Per-node execution results: { nodeId: { status, output, error, duration_ms } }
    node_results: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    // Final output of the last node
    output: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Which node failed (if any)
    failed_node_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    finished_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // BullMQ job ID for tracing
    queue_job_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Execution",
    tableName: "executions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["workflow_id"] },
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
  }
);

module.exports = Execution;
