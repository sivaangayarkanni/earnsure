module.exports = (sequelize, DataTypes) => {
  const Pool = sequelize.define(
    "Pool",
    {
      pool_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      city: { type: DataTypes.TEXT, allowNull: false },
      total_balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      reserve_fund: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "pools", timestamps: false, underscored: true }
  );
  return Pool;
};
