const jwt = require('jsonwebtoken');
const { HttpError } = require('./errorHandler');
const parse = req => jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET);
exports.auth = (req, res, next) => { try { req.user = parse(req); next(); } catch { next(new HttpError(401, 'Please log in')); } };
exports.admin = (req, res, next) => req.user.role === 'admin' ? next() : next(new HttpError(403, 'Admins only'));
