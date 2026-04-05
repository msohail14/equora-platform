import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StableModule = sequelize.define(
  'StableModule',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stable_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    module_key: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    enabled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    enabled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    config: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'stable_modules',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['stable_id', 'module_key'],
      },
    ],
  }
);

export default StableModule;
