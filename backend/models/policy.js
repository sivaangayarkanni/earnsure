module.exports = (sequelize, DataTypes) => {
  const Policy = sequelize.define(
    "Policy",
    {
      policy_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      worker_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      plan_type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      weekly_premium: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      coverage_details: {
        // Use JSON for SQLite compatibility, JSONB for PostgreSQL
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      status: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "active",
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "policies",
      timestamps: false,
      underscored: true,
    }
  );

  return Policy;
};

