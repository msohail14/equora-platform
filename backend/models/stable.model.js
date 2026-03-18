import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Stable = sequelize.define(
  'Stable',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    location_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    lesson_price_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    lesson_price_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    operating_hours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    google_place_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    formatted_address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    google_rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
    },
    google_photos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    opening_hours_text: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'stables',
    timestamps: false,
  }
);

export default Stable;
