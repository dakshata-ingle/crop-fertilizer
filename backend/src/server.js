import express from 'express';
import mongoose from 'mongoose';
import { calculateRequirements, getCatalog } from './calculator.js';
import authRoutes from './routes/auth.js';
import dotenv from 'dotenv';
import cors from 'cors';
import clientRoutes from "./routes/clients.js";
import clientAdminRoutes from "./routes/clientAdmins.js";
import fertilizerRoutes from "./routes/fertilizers.js";
import cropRoutes from "./routes/crops.js";
import cropVarietyRoutes from "./routes/cropVarieties.js";
import growthStagesRoutes from "./routes/growthStages.js";
import fertilizerApprovalRoutes from "./routes/fertilizerApprovals.js";
import Recommendation from './models/Recommendation.js';
import authMiddleware from './middleware/auth.js';
import authorize from './middleware/authorize.js';
import User from './models/User.js';
import Client from './models/Client.js';
import Crop from './models/Crop.js';
import Fertilizer from './models/Fertilizer.js';
import UserClient from './models/UserClient.js';
import notificationRoutes from './routes/notifications.js';
import auditLogRoutes from './routes/auditLogs.js';
import swaggerDocs from './docs/swagger.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crop-fertilizer';
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.warn('⚠️ MongoDB not available:', error.message);
    console.warn('Using in-memory user storage. For production, set up MongoDB Atlas or local MongoDB.');
  }
};

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-admins', clientAdminRoutes);
app.use('/api/fertilizers', fertilizerRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/crop-varieties', cropVarietyRoutes);
app.use('/api/growth-stages', growthStagesRoutes);
app.use('/api/fertilizer-approvals', fertilizerApprovalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api-docs', swaggerDocs);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'fertilizer-calculator-backend' });
});

app.get('/api/catalog', async (req, res) => {
    try {
        const catalog = await getCatalog();

        res.json({
            success: true,
            data: catalog,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch catalog.',
        });
    }
});

app.get('/api/client-admin/dashboard-stats', authMiddleware, authorize('client_admin'), async (req, res) => {
    try {
        const clientId = req.clientId;

        const [farmersCount, cropsCount, fertilizersCount, pendingCropsCount, pendingFertilizersCount, approvedCropsCount, approvedFertilizersCount] = await Promise.all([
            UserClient.countDocuments({ clientId, roleInClient: 'farmer', status: 'active' }),
            Crop.countDocuments({ clientId, isActive: true }),
            Fertilizer.countDocuments({ clientId, isActive: true }),
            Crop.countDocuments({ clientId, status: 'pending', isActive: true }),
            Fertilizer.countDocuments({ clientId, status: 'pending', isActive: true }),
            Crop.countDocuments({ clientId, status: 'approved', isActive: true }),
            Fertilizer.countDocuments({ clientId, status: 'approved', isActive: true }),
        ]);

        res.json({
            success: true,
            stats: {
                farmers: farmersCount,
                crops: cropsCount,
                fertilizers: fertilizersCount,
                pendingSubmissions: pendingCropsCount + pendingFertilizersCount,
                approvedRecords: approvedCropsCount + approvedFertilizersCount,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load client admin dashboard statistics.',
        });
    }
});

app.get('/api/admin/dashboard-stats', authMiddleware, authorize('super_admin'), async (req, res) => {
    try {
        const [
            clientsCount,
            clientAdminsCount,
            farmersCount,
            cropsCount,
            fertilizersCount,
            pendingCropsCount,
            pendingFertilizersCount,
            approvedClientsCount,
            approvedCropsCount,
            approvedFertilizersCount,
        ] = await Promise.all([
            Client.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'client_admin' }),
            User.countDocuments({ role: 'farmer' }),
            Crop.countDocuments({ isActive: true }),
            Fertilizer.countDocuments({ isActive: true }),
            Crop.countDocuments({ status: 'pending', isActive: true }),
            Fertilizer.countDocuments({ status: 'pending', isActive: true }),
            Client.countDocuments({ status: 'approved', isActive: true }),
            Crop.countDocuments({ status: 'approved', isActive: true }),
            Fertilizer.countDocuments({ status: 'approved', isActive: true }),
        ]);

        const [cropsData, fertilizersData] = await Promise.all([
            Crop.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
            Fertilizer.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(6)
                .lean(),
        ]);

        res.json({
            success: true,
            stats: {
                clients: clientsCount,
                clientAdmins: clientAdminsCount,
                farmers: farmersCount,
                crops: cropsCount,
                fertilizers: fertilizersCount,
                pendingApprovals: pendingCropsCount + pendingFertilizersCount,
                approvedRecords: approvedClientsCount + approvedCropsCount + approvedFertilizersCount,
            },
            cropsData: cropsData.map((crop) => ({
                id: crop._id,
                name: crop.name,
                status: crop.status,
                npk: crop.npk || { n: 0, p: 0, k: 0 },
            })),
            fertilizersData: fertilizersData.map((fertilizer) => ({
                id: fertilizer._id,
                name: fertilizer.name,
                status: fertilizer.status,
                n: fertilizer.n || 0,
                p: fertilizer.p || 0,
                k: fertilizer.k || 0,
            })),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to load dashboard statistics.',
        });
    }
});

app.post('/api/calculate', async (req, res) => {
    try {
        const result = await calculateRequirements(req.body);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Request failed.',
        });
    }
});

app.post('/api/recommendations', async (req, res) => {
    try {
        const { token, ...payload } = req.body;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing.',
            });
        }

        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const recommendation = await Recommendation.create({
            userId: decoded.userId,
            clientId: decoded.clientId,
            crop: payload.crop || '',
            cropName: payload.cropName || '',
            fieldArea: Number(payload.fieldArea) || 0,
            areaUnit: payload.areaUnit || 'acre',
            doseType: payload.doseType || 'recommended',
            customDose: payload.customDose || { n: 0, p: 0, k: 0 },
            hasSoilTest: Boolean(payload.hasSoilTest),
            isBookmarked: Boolean(payload.isBookmarked),
            soilTestValues: payload.soilTestValues || { n: 0, p: 0, k: 0 },
            selectedFertilizers: payload.selectedFertilizers || [],
            results: payload.results || null,
        });

        res.status(201).json({
            success: true,
            recommendation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save recommendation.',
        });
    }
});

app.patch('/api/recommendations/:id/bookmark', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing.',
            });
        }

        const jwt = (await import('jsonwebtoken')).default;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { isBookmarked } = req.body;

        const recommendation = await Recommendation.findOne({
            _id: req.params.id,
            userId: decoded.userId,
            clientId: decoded.clientId,
        });

        if (!recommendation) {
            return res.status(404).json({
                success: false,
                message: 'Recommendation not found.',
            });
        }

        recommendation.isBookmarked = Boolean(isBookmarked);
        await recommendation.save();

        res.json({
            success: true,
            recommendation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update recommendation bookmark.',
        });
    }
});

app.get('/api/recommendations', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token is missing.',
            });
        }

        const jwt = (await import('jsonwebtoken')).default;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const recommendations = await Recommendation.find({
            userId: decoded.userId,
            clientId: decoded.clientId,
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            recommendations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch recommendations.',
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.',
    });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Initialize MongoDB connection only when the server is started directly.
    connectDB();

    app.listen(PORT, () => {
        console.log(`Fertilizer calculator backend listening on http://localhost:${PORT}`);
    });
}

export default app;
