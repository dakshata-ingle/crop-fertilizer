import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './swaggerSpec.js';

const router = express.Router();

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openApiSpec, {
  explorer: true,
  customSiteTitle: 'Crop Fertilizer API Docs',
}));

export default router;
