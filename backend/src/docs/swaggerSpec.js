import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Crop Fertilizer API',
    version: '1.0.0',
    description: 'OpenAPI documentation for the existing Crop Fertilizer backend endpoints.',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'Signup, login, and current-user endpoints.' },
    { name: 'Clients', description: 'Client management endpoints.' },
    { name: 'Client Admins', description: 'Client-admin management endpoints.' },
    { name: 'Crops', description: 'Crop catalog and approval endpoints.' },
    { name: 'Fertilizers', description: 'Fertilizer catalog and approval endpoints.' },
    { name: 'Recommendations', description: 'Recommendation save and history endpoints.' },
    { name: 'Notifications', description: 'User notification endpoints.' },
    { name: 'Audit Logs', description: 'Administrative audit log endpoints.' },
    { name: 'System', description: 'Health, catalog, and dashboard statistics endpoints.' },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalItems: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          village: { type: 'string' },
          role: { type: 'string', enum: ['farmer', 'client_admin', 'super_admin'] },
          clientId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          code: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'inactive'] },
          isActive: { type: 'boolean' },
          logo: { type: 'string' },
          createdBy: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Crop: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          clientId: { type: 'string' },
          cropId: { type: 'string' },
          name: { type: 'string' },
          botanicalName: { type: 'string' },
          npk: {
            type: 'object',
            properties: {
              n: { type: 'number' },
              p: { type: 'number' },
              k: { type: 'number' },
            },
          },
          customDose: {
            type: 'object',
            properties: {
              n: { type: 'number' },
              p: { type: 'number' },
              k: { type: 'number' },
            },
          },
          varieties: { type: 'array', items: { type: 'string' } },
          growthStages: { type: 'array', items: { type: 'string' } },
          growthPeriodDays: { type: 'integer' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          isActive: { type: 'boolean' },
          image: { type: 'string' },
        },
      },
      Fertilizer: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          clientId: { type: 'string' },
          fertilizerId: { type: 'string' },
          name: { type: 'string' },
          n: { type: 'number' },
          p: { type: 'number' },
          k: { type: 'number' },
          bagWeight: { type: 'number' },
          price: { type: 'number' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          isActive: { type: 'boolean' },
          image: { type: 'string' },
        },
      },
      Recommendation: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          clientId: { type: 'string' },
          crop: { type: 'string' },
          cropName: { type: 'string' },
          fieldArea: { type: 'number' },
          areaUnit: { type: 'string' },
          doseType: { type: 'string' },
          customDose: {
            type: 'object',
            properties: {
              n: { type: 'number' },
              p: { type: 'number' },
              k: { type: 'number' },
            },
          },
          hasSoilTest: { type: 'boolean' },
          isBookmarked: { type: 'boolean' },
          soilTestValues: {
            type: 'object',
            properties: {
              n: { type: 'number' },
              p: { type: 'number' },
              k: { type: 'number' },
            },
          },
          selectedFertilizers: { type: 'array', items: { type: 'object' } },
          results: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          actorId: { type: 'string' },
          actorName: { type: 'string' },
          actorRole: { type: 'string' },
          action: { type: 'string' },
          entityType: { type: 'string' },
          entityId: { type: 'string' },
          entityName: { type: 'string' },
          description: { type: 'string' },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service health status.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'fertilizer-calculator-backend' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/catalog': {
      get: {
        tags: ['System'],
        summary: 'Get catalog data',
        responses: {
          '200': {
            description: 'Catalog payload.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/calculate': {
      post: {
        tags: ['System'],
        summary: 'Calculate fertilizer requirements',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  crop: { type: 'string' },
                  area: { type: 'number' },
                  areaUnit: { type: 'string' },
                  soilTest: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Calculation result.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Create a farmer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'confirmPassword', 'phone', 'village'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  confirmPassword: { type: 'string', format: 'password' },
                  phone: { type: 'string' },
                  village: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created.', content: { 'application/json': { schema: { type: 'object' } } } },
          '400': { description: 'Validation or duplicate account error.' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' },
                  loginType: { type: 'string', enum: ['farmer', 'client_admin', 'super_admin'], default: 'farmer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication success.' },
          '400': { description: 'Invalid credentials or login type.' },
          '403': { description: 'User is not assigned to an active client role.' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the currently authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user details.' },
          '404': { description: 'User not found.' },
        },
      },
    },
    '/api/auth/users': {
      get: {
        tags: ['Authentication'],
        summary: 'List users (super admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'role', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of users.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    count: { type: 'integer' },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '403': { description: 'Access denied for non-super-admin users.' },
        },
      },
    },
    '/api/clients': {
      post: {
        tags: ['Clients'],
        summary: 'Create a client',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'email'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  logo: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Client created.' },
          '400': { description: 'Validation or duplicate error.' },
        },
      },
      get: {
        tags: ['Clients'],
        summary: 'List clients',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of clients.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    clients: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
                    count: { type: 'integer' },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/clients/{id}': {
      get: {
        tags: ['Clients'],
        summary: 'Get a client by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Client detail.' },
          '403': { description: 'Client admin cannot access another client.' },
          '404': { description: 'Client not found.' },
        },
      },
      put: {
        tags: ['Clients'],
        summary: 'Update a client',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name', 'code', 'email'],
                properties: {
                  name: { type: 'string' },
                  code: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  logo: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Client updated.' },
          '404': { description: 'Client not found.' },
        },
      },
    },
    '/api/client-admins': {
      get: {
        tags: ['Client Admins'],
        summary: 'List client admins',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': { description: 'Paginated list of client admins.' },
        },
      },
      post: {
        tags: ['Client Admins'],
        summary: 'Create a client admin',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'village', 'password', 'confirmPassword', 'clientId'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  village: { type: 'string' },
                  password: { type: 'string', format: 'password' },
                  confirmPassword: { type: 'string', format: 'password' },
                  clientId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Client admin created.' },
          '400': { description: 'Validation or duplicate account error.' },
        },
      },
    },
    '/api/client-admins/{id}': {
      get: {
        tags: ['Client Admins'],
        summary: 'Get a client admin by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Client admin detail.' },
          '404': { description: 'Client admin not found.' },
        },
      },
      put: {
        tags: ['Client Admins'],
        summary: 'Update a client admin',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'village', 'clientId'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  village: { type: 'string' },
                  clientId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Client admin updated.' },
          '400': { description: 'Validation or duplicate account error.' },
        },
      },
    },
    '/api/client-admins/{id}/status': {
      patch: {
        tags: ['Client Admins'],
        summary: 'Toggle a client admin membership status',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['active', 'inactive'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated.' },
          '404': { description: 'Client admin not found.' },
        },
      },
    },
    '/api/crops': {
      get: {
        tags: ['Crops'],
        summary: 'List crops for the authenticated client or farmer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': { description: 'Paginated list of crops.' },
        },
      },
      post: {
        tags: ['Crops'],
        summary: 'Create a crop entry',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  cropId: { type: 'string' },
                  name: { type: 'string' },
                  botanicalName: { type: 'string' },
                  npk: { type: 'string' },
                  customDose: { type: 'string' },
                  varieties: { type: 'string' },
                  growthStages: { type: 'string' },
                  growthPeriodDays: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Crop created and marked pending approval.' },
          '400': { description: 'Validation or duplicate error.' },
        },
      },
    },
    '/api/crops/pending': {
      get: {
        tags: ['Crops'],
        summary: 'List pending crops (super admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': { description: 'Pending crops list.' },
        },
      },
    },
    '/api/crops/{id}': {
      get: {
        tags: ['Crops'],
        summary: 'Get a crop by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Crop detail.' },
          '404': { description: 'Crop not found.' },
        },
      },
      put: {
        tags: ['Crops'],
        summary: 'Update a crop',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  cropId: { type: 'string' },
                  name: { type: 'string' },
                  botanicalName: { type: 'string' },
                  npk: { type: 'string' },
                  customDose: { type: 'string' },
                  varieties: { type: 'string' },
                  growthStages: { type: 'string' },
                  growthPeriodDays: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Crop updated and re-submitted for approval.' },
          '404': { description: 'Crop not found.' },
        },
      },
    },
    '/api/crops/{id}/soft-delete': {
      patch: {
        tags: ['Crops'],
        summary: 'Soft delete a crop',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Crop deactivated.' },
          '404': { description: 'Crop not found.' },
        },
      },
    },
    '/api/fertilizers': {
      get: {
        tags: ['Fertilizers'],
        summary: 'List fertilizers for the authenticated client or farmer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'status', schema: { type: 'string' } },
          { in: 'query', name: 'isActive', schema: { type: 'string' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          '200': { description: 'Paginated list of fertilizers.' },
        },
      },
      post: {
        tags: ['Fertilizers'],
        summary: 'Create a fertilizer entry',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  fertilizerId: { type: 'string' },
                  n: { type: 'string' },
                  p: { type: 'string' },
                  k: { type: 'string' },
                  bagWeight: { type: 'string' },
                  price: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Fertilizer created and marked pending approval.' },
          '400': { description: 'Validation or duplicate error.' },
        },
      },
    },
    '/api/fertilizers/{id}': {
      get: {
        tags: ['Fertilizers'],
        summary: 'Get a fertilizer by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Fertilizer detail.' },
          '404': { description: 'Fertilizer not found.' },
        },
      },
      put: {
        tags: ['Fertilizers'],
        summary: 'Update a fertilizer',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  fertilizerId: { type: 'string' },
                  n: { type: 'string' },
                  p: { type: 'string' },
                  k: { type: 'string' },
                  bagWeight: { type: 'string' },
                  price: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Fertilizer updated and re-submitted for approval.' },
          '404': { description: 'Fertilizer not found.' },
        },
      },
    },
    '/api/fertilizers/{id}/soft-delete': {
      patch: {
        tags: ['Fertilizers'],
        summary: 'Soft delete a fertilizer',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Fertilizer deactivated.' },
          '404': { description: 'Fertilizer not found.' },
        },
      },
    },
    '/api/fertilizer-approvals/pending': {
      get: {
        tags: ['Fertilizers'],
        summary: 'List pending fertilizer approvals',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Pending fertilizers list.' },
        },
      },
    },
    '/api/fertilizer-approvals/{id}/status': {
      patch: {
        tags: ['Fertilizers'],
        summary: 'Approve or reject a fertilizer',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['approved', 'rejected'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Fertilizer approval state updated.' },
          '404': { description: 'Fertilizer not found.' },
        },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Notification list.' },
        },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark a notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Notification updated.' },
          '404': { description: 'Notification not found.' },
        },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'All notifications marked as read.' },
        },
      },
    },
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List recent audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 }, description: 'Maximum number of audit logs to return.' },
        ],
        responses: {
          '200': {
            description: 'Audit log list.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    auditLogs: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/client-admin/dashboard-stats': {
      get: {
        tags: ['System'],
        summary: 'Get client-admin dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard stats for a client admin.' },
        },
      },
    },
    '/api/admin/dashboard-stats': {
      get: {
        tags: ['System'],
        summary: 'Get super-admin dashboard stats',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard stats for a super admin.' },
        },
      },
    },
    '/api/recommendations': {
      post: {
        tags: ['Recommendations'],
        summary: 'Create a recommendation record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string' },
                  crop: { type: 'string' },
                  cropName: { type: 'string' },
                  fieldArea: { type: 'number' },
                  areaUnit: { type: 'string' },
                  doseType: { type: 'string' },
                  customDose: { type: 'object' },
                  hasSoilTest: { type: 'boolean' },
                  isBookmarked: { type: 'boolean' },
                  soilTestValues: { type: 'object' },
                  selectedFertilizers: { type: 'array', items: { type: 'object' } },
                  results: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Recommendation created.' },
          '401': { description: 'Authentication token missing.' },
        },
      },
      get: {
        tags: ['Recommendations'],
        summary: 'List recommendations for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Recommendation history for the current user.' },
          '401': { description: 'Authentication token missing.' },
        },
      },
    },
    '/api/recommendations/{id}/bookmark': {
      patch: {
        tags: ['Recommendations'],
        summary: 'Toggle bookmark state for a recommendation',
        security: [{ bearerAuth: [] }],
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isBookmarked'],
                properties: {
                  isBookmarked: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Bookmark updated.' },
          '404': { description: 'Recommendation not found.' },
        },
      },
    },
  },
  externalDocs: {
    description: 'Backend README',
    url: 'http://localhost:3001/api-docs',
  },
};

export { openApiSpec, __dirname };
export default openApiSpec;
