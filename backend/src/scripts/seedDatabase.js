import mongoose from "mongoose";
import dotenv from "dotenv";

import Client from "../models/Client.js";
import Crop from "../models/Crop.js";
import Fertilizer from "../models/Fertilizer.js";

import { cropsData, fertilizerData } from "../data.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/crop-fertilizer";

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB Connected");
}

async function seedDatabase() {
  try {
    await connectDB();

    console.log("\n=================================");
    console.log("Starting Database Seeding...");
    console.log("=================================\n");

    // --------------------------------------------------
    // Create Default Client
    // --------------------------------------------------

    let client = await Client.findOne({
      code: "DEFAULT",
    });

    if (!client) {
      client = await Client.create({
        name: "Default Client",
        code: "DEFAULT",
        email: "default@cropferti.com",
        phone: "",
        address: "",
        description: "System Default Client",
        status: "approved",
        isActive: true,
      });

      console.log("✅ Default Client Created");
    } else {
      console.log("✓ Default Client Already Exists");
    }

    // --------------------------------------------------
    // Seed Crops
    // --------------------------------------------------

    let cropCount = 0;

    for (const crop of cropsData) {
      await Crop.findOneAndUpdate(
        {
          clientId: client._id,
          cropId: crop.id,
        },
        {
          clientId: client._id,

          cropId: crop.id,

          name: crop.name,

          botanicalName: crop.botanicalName,

          npk: crop.npk,

          customDose: crop.npk,

          varieties: [],

          growthStages: [],

          growthPeriodDays: 0,

          description: "",

          image: crop.image || "",

          status: "approved",

          isActive: true,
        },
        {
          upsert: true,
          new: true,
        }
      );

      cropCount++;
    }

    console.log(`✅ ${cropCount} Crops Seeded`);

    // --------------------------------------------------
    // Seed Fertilizers
    // --------------------------------------------------

    let fertilizerCount = 0;

    for (const fertilizer of fertilizerData) {
      await Fertilizer.findOneAndUpdate(
        {
          clientId: client._id,
          fertilizerId: fertilizer.id,
        },
        {
          clientId: client._id,

          fertilizerId: fertilizer.id,

          name: fertilizer.name,

          n: fertilizer.n,

          p: fertilizer.p,

          k: fertilizer.k,

          bagWeight: fertilizer.bagWeight,

          price: fertilizer.price,

          description: "",

          micronutrients: {
            sulfur: 0,
            zinc: 0,
            boron: 0,
            iron: 0,
            manganese: 0,
            copper: 0,
          },

          status: "approved",

          isActive: true,
        },
        {
          upsert: true,
          new: true,
        }
      );

      fertilizerCount++;
    }

    console.log(`✅ ${fertilizerCount} Fertilizers Seeded`);

    console.log("\n=================================");
    console.log("DATABASE SEEDED SUCCESSFULLY");
    console.log("=================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database Seeding Failed");
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();