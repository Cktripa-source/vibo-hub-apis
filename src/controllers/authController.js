import User from '../models/User.js';
import { signTokens } from '../middleware/auth.js';
import { ok } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email in use' });
    const user = await User.create({ name, email, password, role });
    const tokens = signTokens({ id: user._id, role: user.role, email: user.email });
    ok(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens }, 'Registered');
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const tokens = signTokens({ id: user._id, role: user.role, email: user.email });
    ok(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens }, 'Logged in');
  } catch (e) { next(e); }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    ok(res, user);
  } catch (e) { next(e); }
};
