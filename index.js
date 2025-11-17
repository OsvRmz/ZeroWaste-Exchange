import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import morgan from 'morgan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET || !MONGO_URI) {
  console.error('Faltan variables de entorno: MONGO_URI y/o JWT_SECRET');
  process.exit(1);
}

/* -------------------- MIDDLEWARES -------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos públicos (imágenes etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Servir build de React
app.use(express.static(path.join(__dirname, 'build')));

/* -------------------- MULTER (subida de imágenes) -------------------- */
const uploadDir = path.join(__dirname, 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safe);
  }
});
const upload = multer({ storage });

/* -------------------- MONGOOSE & MODELOS -------------------- */
mongoose.set('strictQuery', true);
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error(err));

const { Schema, model, Types } = mongoose;

/* Usuario */
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // NOTA: password en texto plano para prototipo escolar
  password: { type: String, required: true },
  city: { type: String },
  photo: { type: String },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true });

const User = model('User', UserSchema);

/* Item / Publicación */
const ItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  condition: { type: String, enum: ['nuevo', 'buen estado', 'usado'], default: 'buen estado' },
  transactionType: { type: String, enum: ['intercambio', 'donación', 'venta'], required: true },
  price: { type: Number, default: 0 },
  location: { type: String },
  imagePath: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Item = model('Item', ItemSchema);

/* Reporte */
const ReportSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  reporterEmail: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Report = model('Report', ReportSchema);

/* Transaction / Solicitud */
const TransactionSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  requester: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // quien solicita
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // dueño del artículo (redundante pero útil)
  message: { type: String, required: true },
  offeredPrice: { type: Number }, // si es una propuesta de compra
  proposedItem: { type: Schema.Types.ObjectId, ref: 'Item' }, // si propones un intercambio
  contactEmail: { type: String }, // email del solicitante (opcional)
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  note: { type: String }, // nota del propietario al responder
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Transaction = model('Transaction', TransactionSchema);

/* -------------------- HELPERS & MIDDLEWARES AUTH -------------------- */
function generateToken(user) {
  const payload = { id: user._id, email: user.email, name: user.name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// authMiddleware: si token válido -> req.user y req.currentUser cargado
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No autorizado' });
  const token = auth.split(' ')[1];
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = payload; // { id, email, name }
  req.currentUser = await User.findById(payload.id).select('-password');
  next();
}

/* -------------------- RUTAS: AUTH -------------------- */
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, city, photo } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ message: 'Email ya registrado' });

  const user = await User.create({ name, email: email.toLowerCase(), password, city, photo });
  const token = generateToken(user);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, city: user.city, photo: user.photo } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });
  const ok = user.password === password;
  if (!ok) return res.status(400).json({ message: 'Credenciales inválidas' });
  const token = generateToken(user);
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, city: user.city, photo: user.photo } });
});

/* -------------------- RUTAS: USUARIO -------------------- */
app.get('/api/users/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password').populate('favorites');
  res.json(user);
});

app.put('/api/users/me', authMiddleware, upload.single('photo'), async (req, res) => {
  const { name, city } = req.body;
  const update = { name, city };
  if (req.file) {
    update.photo = `/public/uploads/${req.file.filename}`;
  }
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
  res.json(user);
});

/* -------------------- RUTAS: ITEMS / PUBLICACIONES -------------------- */
app.post('/api/items', authMiddleware, upload.single('image'), async (req, res) => {
  const { title, description, category, condition, transactionType, price, location } = req.body;
  const imagePath = req.file ? `/public/uploads/${req.file.filename}` : undefined;
  const item = await Item.create({
    title, description, category, condition, transactionType,
    price: price ? Number(price) : 0, location,
    imagePath, owner: req.user.id
  });
  res.status(201).json(item);
});

app.put('/api/items/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Artículo no encontrado' });
  if (String(item.owner) !== String(req.user.id)) return res.status(403).json({ message: 'No autorizado' });

  const { title, description, category, condition, transactionType, price, location } = req.body;
  if (req.file) item.imagePath = `/public/uploads/${req.file.filename}`;
  if (title) item.title = title;
  if (description) item.description = description;
  if (category) item.category = category;
  if (condition) item.condition = condition;
  if (transactionType) item.transactionType = transactionType;
  if (price !== undefined) item.price = Number(price);
  if (location) item.location = location;
  await item.save();
  res.json(item);
});

app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Artículo no encontrado' });
  if (String(item.owner) !== String(req.user.id)) return res.status(403).json({ message: 'No autorizado' });
  item.active = false;
  await item.save();
  res.json({ message: 'Artículo desactivado' });
});

app.get('/api/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id).populate('owner', 'name city email photo');
  if (!item) return res.status(404).json({ message: 'Artículo no encontrado' });
  res.json(item);
});

app.get('/api/items', async (req, res) => {
  const { q, category, transactionType, sort = 'newest', page = 1, limit = 20 } = req.query;
  const filter = { active: true };
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (category) filter.category = category;
  if (transactionType) filter.transactionType = transactionType;

  const sortObj = (sort === 'oldest') ? { createdAt: 1 } : { createdAt: -1 };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Item.find(filter).sort(sortObj).skip(skip).limit(Number(limit)).populate('owner', 'name city email photo'),
    Item.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

/* -------------------- FAVORITOS -------------------- */
app.post('/api/items/:id/favorite', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  const itemId = req.params.id;

  const exists = user.favorites.some(f => String(f) === String(itemId));
  if (exists) {
    user.favorites = user.favorites.filter(f => String(f) !== String(itemId));
  } else {
    user.favorites.push(new Types.ObjectId(itemId));
  }
  await user.save();

  const populated = await User.findById(req.user.id).populate('favorites');
  res.json(populated.favorites);
});

app.get('/api/users/me/favorites', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).populate('favorites');
  res.json(user.favorites);
});

/* -------------------- DASHBOARD / MI CUENTA -------------------- */
app.get('/api/users/me/items', authMiddleware, async (req, res) => {
  const items = await Item.find({ owner: req.user.id }).sort({ createdAt: -1 });
  res.json(items);
});

app.get('/api/users/me/stats', authMiddleware, async (req, res) => {
  const totalPublished = await Item.countDocuments({ owner: req.user.id });
  const totalFavorites = (await User.findById(req.user.id)).favorites.length;
  res.json({ totalPublished, totalFavorites });
});

/* -------------------- REPORTES -------------------- */
app.post('/api/reports', async (req, res) => {
  const { itemId, reporterEmail, reason } = req.body;
  const item = await Item.findById(itemId);
  if (!item) return res.status(404).json({ message: 'Artículo no encontrado' });
  const report = await Report.create({ item: item._id, reporterEmail, reason });
  res.status(201).json(report);
});

/* -------------------- MÉTRICAS AMBIENTALES -------------------- */
const WEIGHT_MAP = {
  'Ropa': 1,
  'Libros': 1,
  'Electrónica': 2,
  'Mueble': 5,
  'Otros': 1
};

app.get('/api/metrics/environment', async (req, res) => {
  const activeItems = await Item.find({ active: true });
  const objectsReused = activeItems.length;

  let estimatedKgSaved = 0;
  const categoryMap = {};

  for (const item of activeItems) {
    const cat = item.category || 'Otros';
    const kg = WEIGHT_MAP[cat] || WEIGHT_MAP['Otros'];
    estimatedKgSaved += kg;
    if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, kg: 0 };
    categoryMap[cat].count += 1;
    categoryMap[cat].kg += kg;
  }

  const byCategory = Object.values(categoryMap);
  res.json({ objectsReused, estimatedKgSaved, byCategory });
});

/* -------------------- RUTAS: TRANSACCIONES / SOLICITUDES -------------------- */

/**
 * Crear una solicitud de transacción
 * body: { itemId, message, offeredPrice?, proposedItemId?, contactEmail? }
 * Auth required (solicitante)
 */
app.post('/api/transactions', authMiddleware, async (req, res) => {
  const { itemId, message, offeredPrice, proposedItemId, contactEmail } = req.body;
  if (!itemId || !message) return res.status(400).json({ message: 'itemId y message son requeridos' });

  const item = await Item.findById(itemId);
  if (!item || !item.active) return res.status(404).json({ message: 'Artículo no encontrado o no disponible' });

  // no permitir solicitar tu propio artículo
  if (String(item.owner) === String(req.user.id)) return res.status(400).json({ message: 'No puedes solicitar tu propio artículo' });

  const tx = await Transaction.create({
    item: item._id,
    requester: req.user.id,
    owner: item.owner,
    message,
    offeredPrice: offeredPrice !== undefined ? Number(offeredPrice) : undefined,
    proposedItem: proposedItemId ? proposedItemId : undefined,
    contactEmail: contactEmail || undefined,
    status: 'pending'
  });

  const populated = await Transaction.findById(tx._id)
    .populate('item')
    .populate('requester', 'name email city photo')
    .populate('owner', 'name email city photo')
    .populate('proposedItem');

  res.status(201).json(populated);
});

/**
 * Listar solicitudes (filtro/paginación)
 * Query params: itemId, status, direction(incoming|outgoing), page, limit
 * Auth required (devolvemos solo solicitudes relacionadas con el usuario si direction provided)
 */
app.get('/api/transactions', authMiddleware, async (req, res) => {
  const { itemId, status, direction, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (itemId) filter.item = itemId;
  if (status) filter.status = status;

  // Si direction viene, filtrar por owner/requester según el usuario logueado
  if (direction === 'incoming') filter.owner = req.user.id;
  else if (direction === 'outgoing') filter.requester = req.user.id;
  else {
    // Si no hay direction, por defecto devolvemos solicitudes donde el usuario participa (owner OR requester)
    filter.$or = [{ owner: req.user.id }, { requester: req.user.id }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('item')
      .populate('requester', 'name email city photo')
      .populate('owner', 'name email city photo')
      .populate('proposedItem'),
    Transaction.countDocuments(filter)
  ]);

  res.json({ requests, total, page: Number(page), limit: Number(limit) });
});

/**
 * Obtener solicitud específica (solo requester o owner)
 */
app.get('/api/transactions/:id', authMiddleware, async (req, res) => {
  const tx = await Transaction.findById(req.params.id)
    .populate('item')
    .populate('requester', 'name email city photo')
    .populate('owner', 'name email city photo')
    .populate('proposedItem');
  if (!tx) return res.status(404).json({ message: 'Solicitud no encontrada' });

  if (String(tx.requester._id) !== String(req.user.id) && String(tx.owner._id) !== String(req.user.id)) {
    return res.status(403).json({ message: 'No autorizado' });
  }
  res.json(tx);
});

/**
 * Responder a una solicitud (solo el owner puede responder)
 * body: { status: 'accepted'|'rejected'|'cancelled'|'completed', note? }
 */
app.post('/api/transactions/:id/respond', authMiddleware, async (req, res) => {
  const { status, note } = req.body;
  const allowed = ['accepted', 'rejected', 'cancelled', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Status inválido' });

  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Solicitud no encontrada' });
  if (String(tx.owner) !== String(req.user.id)) return res.status(403).json({ message: 'No autorizado' });

  tx.status = status;
  if (note) tx.note = note;
  tx.updatedAt = new Date();

  await tx.save();

  const populated = await Transaction.findById(tx._id)
    .populate('item')
    .populate('requester', 'name email city photo')
    .populate('owner', 'name email city photo')
    .populate('proposedItem');

  res.json(populated);
});

/**
 * Cancelar solicitud (solicitante puede cancelar; owner también puede cancelar)
 */
app.post('/api/transactions/:id/cancel', authMiddleware, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Solicitud no encontrada' });

  const isRequester = String(tx.requester) === String(req.user.id);
  const isOwner = String(tx.owner) === String(req.user.id);
  if (!isRequester && !isOwner) return res.status(403).json({ message: 'No autorizado' });

  tx.status = 'cancelled';
  tx.updatedAt = new Date();
  await tx.save();

  const populated = await Transaction.findById(tx._id)
    .populate('item')
    .populate('requester', 'name email city photo')
    .populate('owner', 'name email city photo')
    .populate('proposedItem');

  res.json(populated);
});

/**
 * Marcar solicitud como completada (owner o requester)
 * Puedes ajustar aquí para marcar item.active = false si quieres que al completar la transacción
 * se marque el artículo como no disponible (aquí lo dejamos simple: solo cambiamos el estado)
 */
app.post('/api/transactions/:id/complete', authMiddleware, async (req, res) => {
  const tx = await Transaction.findById(req.params.id).populate('item');
  if (!tx) return res.status(404).json({ message: 'Solicitud no encontrada' });

  const isRequester = String(tx.requester) === String(req.user.id);
  const isOwner = String(tx.owner) === String(req.user.id);
  if (!isRequester && !isOwner) return res.status(403).json({ message: 'No autorizado' });

  tx.status = 'completed';
  tx.updatedAt = new Date();
  await tx.save();

  // Opcional: marcar el item como inactivo cuando se completa (descomenta si quieres esto)
  const item = await Item.findById(tx.item);
  if (item) { item.active = false; await item.save(); }

  const populated = await Transaction.findById(tx._id)
    .populate('item')
    .populate('requester', 'name email city photo')
    .populate('owner', 'name email city photo')
    .populate('proposedItem');

  res.json(populated);
});

/* -------------------- FALLBACK PARA REACT ROUTER -------------------- */
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

/* -------------------- MIDDLEWARE: 404 y ERROR HANDLER -------------------- */
// 404 para rutas API no encontradas
app.use(/^\/api\/.*/, (req, res) => {
  res.status(404).json({ message: 'Endpoint API no encontrado' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ message });
});

/* -------------------- INICIAR SERVIDOR -------------------- */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
