module.exports = (sequelize, DataTypes) => {
  const Claim = sequelize.define(
    "Claim",
    {
      claim_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      policy_id: { type: DataTypes.UUID, allowNull: false },
      event_type: { type: DataTypes.TEXT, allowNull: false },
      lost_income: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      claim_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "submitted" },
      payout_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "claims", timestamps: false, underscored: true }
  );
  return Claim;
};
