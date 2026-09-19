import bcryptjs from 'bcryptjs';

// In-memory user storage (for testing without MongoDB)
let users = [];
let userIdCounter = 1;

export const inMemoryUserStore = {
  // Create user
  create: async (userData) => {
    const user = {
      _id: String(userIdCounter++),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(user);
    return user;
  },

  // Find user by email
  findByEmail: async (email) => {
    return users.find(u => u.email === email);
  },

  // Find user by ID
  findById: async (id) => {
    return users.find(u => u._id === id);
  },

  // Check if email exists
  emailExists: async (email) => {
    return users.some(u => u.email === email);
  },

  // Get all users
  getAll: () => users,

  // Clear all (for testing)
  clear: () => {
    users = [];
    userIdCounter = 1;
  },
};
