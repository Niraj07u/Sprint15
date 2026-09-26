import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const dataDir = path.resolve(process.cwd(), ".data");
const usersFile = path.join(dataDir, "users.json");
const itemsFile = path.join(dataDir, "workspace-items.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadJson(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch {
    // fallback
  }
  return defaultVal;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // fallback
  }
}

export const memoryStore = {
  users: loadJson(usersFile, []),
  items: loadJson(itemsFile, []),

  async createUser({ name, email, password }) {
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      _id: id,
      id,
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    saveJson(usersFile, this.users);
    return user;
  },

  findUserByEmail(email) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id) {
    return this.users.find((u) => u.id === id || u._id === id);
  },

  async verifyPassword(user, password) {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  },

  listItems(userId) {
    return this.items
      .filter((i) => i.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createItem(itemData, userId) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const item = {
      _id: id,
      id,
      userId,
      title: itemData.title,
      description: itemData.description || "",
      status: itemData.status || "planned",
      priority: itemData.priority || "medium",
      dueDate: itemData.dueDate || null,
      category: itemData.category || "General",
      tags: Array.isArray(itemData.tags) ? itemData.tags : [],
      aiSummary: itemData.aiSummary || "",
      createdAt: now,
      updatedAt: now,
    };
    this.items.unshift(item);
    saveJson(itemsFile, this.items);
    return item;
  },

  updateItem(itemId, itemData, userId) {
    const itemIndex = this.items.findIndex(
      (i) => (i._id === itemId || i.id === itemId) && i.userId === userId,
    );
    if (itemIndex === -1) return null;
    const existing = this.items[itemIndex];
    const updated = {
      ...existing,
      ...itemData,
      updatedAt: new Date().toISOString(),
    };
    this.items[itemIndex] = updated;
    saveJson(itemsFile, this.items);
    return updated;
  },

  deleteItem(itemId, userId) {
    const itemIndex = this.items.findIndex(
      (i) => (i._id === itemId || i.id === itemId) && i.userId === userId,
    );
    if (itemIndex === -1) return false;
    this.items.splice(itemIndex, 1);
    saveJson(itemsFile, this.items);
    return true;
  },
};
