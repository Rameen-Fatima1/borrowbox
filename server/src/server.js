require('dotenv').config();
const express = require('express'), cors = require('cors'), { errorHandler } = require('./middleware/errorHandler');
const app = express(); app.use(cors(), express.json());
['auth', 'items', 'categories', 'bookings', 'reviews', 'admin'].forEach(m => app.use('/api', require(`./routes/${m}`)));
app.use((q, s) => s.status(404).json({ success: false, data: null, message: 'Route not found' }));
app.use(errorHandler);
app.listen(process.env.PORT || 5000, () => console.log('BorrowBox API running'));
