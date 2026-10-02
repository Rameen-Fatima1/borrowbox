class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const ah = f => (req, res, next) => f(req, res, next).catch(next);
const ok = (res, data, message = 'OK', code = 200) => res.status(code).json({ success: true, data, message });
const errorHandler = (err, req, res, next) => {
  let status = err.status, message = err.message;
  if (!status) {
    if (err.code === '23505') { status = 409; message = 'Already exists'; }
    else if (err.code === '23503' || err.code === '23514') { status = 409; message = 'Conflicts with existing data'; }
    else { status = 500; message = 'Server error'; console.error(err); }
  }
  res.status(status).json({ success: false, data: null, message });
};
module.exports = { HttpError, ah, ok, errorHandler };
