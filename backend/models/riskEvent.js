module.exports = (sequelize, DataTypes) => {
  const RiskEvent = sequelize.define(
    "RiskEvent",
    {
      event_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      location: { type: DataTypes.TEXT, allowNull: false },
      event_type: { type: DataTypes.TEXT, allowNull: false },
      severity: { type: DataTypes.DECIMAL(6, 3), allowNull: false },
      timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "risk_events", timestamps: false, underscored: true }
  );
  return RiskEvent;
};
