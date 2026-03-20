module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define(
    "Worker",
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      phone: { type: DataTypes.TEXT, allowNull: false, unique: true },
      city: { type: DataTypes.TEXT, allowNull: false },
      platform: { type: DataTypes.TEXT, allowNull: false },
      // work_type, latitude, longitude removed for prototype
      risk_score: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "workers", timestamps: true, createdAt: "created_at", updatedAt: false, underscored: true }
  );
  return Worker;
};
