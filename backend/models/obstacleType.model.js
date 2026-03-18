import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ObstacleType = sequelize.define(
  'ObstacleType',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    icon_key: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('jump', 'combination', 'terrain'),
      allowNull: false,
      defaultValue: 'jump',
    },
    default_height_range: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'obstacle_types',
    timestamps: false,
  }
);

export default ObstacleType;
