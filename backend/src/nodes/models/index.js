const User       = require("./User.model");
const Workflow   = require("./Workflow.model");
const Execution  = require("./Execution.model");
const Credential = require("./Credential.model");
const Plan       = require("./Plan.model");

// ─── Associations ──────────────────────────────────────────────────

// Plan <-> User
Plan.hasMany(User, { foreignKey: "plan_id", as: "users" });
User.belongsTo(Plan, { foreignKey: "plan_id", as: "plan" });

// User <-> Workflow
User.hasMany(Workflow, { foreignKey: "user_id", as: "workflows", onDelete: "CASCADE" });
Workflow.belongsTo(User, { foreignKey: "user_id", as: "owner" });

// User <-> Credential
User.hasMany(Credential, { foreignKey: "user_id", as: "credentials", onDelete: "CASCADE" });
Credential.belongsTo(User, { foreignKey: "user_id", as: "owner" });

// Workflow <-> Execution
Workflow.hasMany(Execution, { foreignKey: "workflow_id", as: "executions", onDelete: "CASCADE" });
Execution.belongsTo(Workflow, { foreignKey: "workflow_id", as: "workflow" });

// User <-> Execution
User.hasMany(Execution, { foreignKey: "user_id", as: "executions" });
Execution.belongsTo(User, { foreignKey: "user_id", as: "owner" });

module.exports = { User, Workflow, Execution, Credential, Plan };
