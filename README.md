# HopeBridge Charity Events

PROG2002 A2 dynamic charity event browser. All organisations, events and amounts are fictional seed data for assessment testing.

## Features

- Responsive English visitor-facing Home, Search Events and Event Details pages.
- Database-driven local event imagery and an accessible under-construction registration modal.
- MySQL-backed organisation, category and event data.
- Express REST API with GET-only endpoints for A2.
- Parameterised search queries and public filtering of suspended events.
- Loading, empty-result, network-error and invalid-event states.
- TypeScript model and validation example.

## Setup

1. Install Node.js and npm, then run `npm install`.
2. Import `database/schema.sql` into MySQL. It creates `charityevents_db`, three related tables and 10 fictional events.
3. Copy `.env.example` to `.env` and set the MySQL password.
4. Run `npm start` and open `http://localhost:3060`.

Do not open `public/index.html` directly with a `file:///` URL. The pages retrieve event data from the Express API, so the Node.js server must be running and the website must be opened through `http://localhost:3060`.

## API

- `GET /api/health`
- `GET /api/events`
- `GET /api/events/organisations`
- `GET /api/events/categories`
- `GET /api/events/search?date=&location=&category=`
- `GET /api/events/:id`

POST, PUT and DELETE are intentionally not implemented in A2. Registration is a display-only button that opens the required under-construction modal.

## Quality checklist

The implementation separates routes, controllers and database configuration, uses prepared statements, returns meaningful HTTP status codes, filters suspended events in every public event query, and uses responsive UI layouts for desktop and mobile.

