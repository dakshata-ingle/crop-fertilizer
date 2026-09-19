import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

import User from './src/models/User.js';
import Client from './src/models/Client.js';
import UserClient from './src/models/UserClient.js';

dotenv.config();

const mongoURI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/crop-fertilizer';

const superAdminEmail = 'admin@example.com';
const superAdminPassword = 'admin123';

async function connectDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function createSuperAdmin() {
  await connectDB();

  try {
    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({
      email: superAdminEmail,
    });

    if (existingSuperAdmin) {
      console.log('⚠️ Super Admin already exists');
      console.log({
        id: existingSuperAdmin._id,
        email: existingSuperAdmin.email,
        role: existingSuperAdmin.role,
      });

      await mongoose.disconnect();
      return;
    }

    // Find DEFAULT client
    const defaultClient = await Client.findOne({
      code: 'DEFAULT',
    });

    if (!defaultClient) {
      throw new Error(
        'DEFAULT client not found. Please run database seeding first.'
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(superAdminPassword, 10);

    // Create Super Admin user
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      phone: '0000000000',
      village: 'Head Office',
      password: hashedPassword,
      role: 'super_admin',
    });

    // Create User -> Client mapping
    await UserClient.create({
      userId: superAdmin._id,
      clientId: defaultClient._id,
      roleInClient: 'client_admin',
      status: 'active',
    });

    console.log('\n================================');
    console.log('✅ Super Admin created successfully');
    console.log('================================\n');

    console.log({
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
      client: defaultClient.name,
    });

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createSuperAdmin();