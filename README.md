# BorrowBox – Community Tool & Equipment Lending (PERN)

Members list items, others check date-wise availability and request them. The owner approves, handover and return are logged with condition notes, and both sides review each other.

## Tech stack
PostgreSQL · Express.js · React (Vite) · Node.js

## Setup
1. Create the database: `createdb borrowbox`
2. Server:
   ```
   cd server
   cp .env.example .env      # set DATABASE_URL and JWT_SECRET
   npm install
   psql $DATABASE_URL -f src/db/schema.sql -f src/db/seed.sql
   npm run dev               # http://localhost:5000
   ```
3. Client (new terminal):
   ```
   cd client
   npm install
   npm run dev               # http://localhost:5173 (proxies /api to :5000)
   ```

Demo logins (password `Password123`): `admin@borrowbox.app`, `ali@borrowbox.app`, `sara@borrowbox.app`

## Highlights
- Date-overlap SQL query blocks double booking (APPROVED / PICKED_UP)
- Status state machine (409 on invalid moves) and a transaction on approve (row lock + auto-reject clashes)
- Condition logs at pickup and return, overdue flag, trust score = AVG(rating)
- All 13 business rules from the brief; JSON `{ success, data, message }` responses; parameterised SQL

## API
Auth: `POST /api/auth/register|login`, `GET /api/auth/me` · Users: `PUT|DELETE /api/users/me`, `GET /api/users/:id`
Categories: `GET|POST /api/categories`, `PUT|DELETE /api/categories/:id`
Items: `GET|POST /api/items`, `GET /api/items/mine`, `GET|PUT|DELETE /api/items/:id`, `GET /api/items/:id/availability`
Bookings: `POST /api/bookings`, `GET /api/bookings/mine|incoming|:id`, `PUT|DELETE /api/bookings/:id`, `PATCH /api/bookings/:id/status`
Reviews: `POST /api/bookings/:id/reviews`, `PUT|DELETE /api/reviews/:id`
Admin: `GET /api/admin/stats|users`, `PATCH /api/admin/users/:id/status`
