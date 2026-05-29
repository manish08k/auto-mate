const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Plan extends Model {
  // Helper: check if a feature is included in this plan
  hasFeature(feature) {
    return this.features?.includes(feature) ?? false;
  }
}

Plan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // "free" | "starter" | "pro" | "enterprise"
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false, // "Free", "Starter", "Pro", "Enterprise"
    },
    price_monthly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    price_yearly: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Hard limits
    max_workflows: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    max_executions_per_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    max_credentials: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
    },
    // Minimum cron interval in minutes (e.g. 60 = hourly minimum)
    min_schedule_interval_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
    },
    // Feature flags — e.g. ["webhook_trigger", "custom_http", "openai", "priority_support"]
    features: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    // Razorpay / Stripe plan IDs for billing
    razorpay_plan_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stripe_price_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // false = internal/enterprise-only
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // for display ordering on pricing page
    },
  },
  {
    sequelize,
    modelName: "Plan",
    tableName: "plans",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["name"] }],
  }
);

module.exports = Plan;
