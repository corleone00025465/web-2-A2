const db = require('../event_db');

const fields = `
  e.id, e.name, e.description,
  DATE_FORMAT(e.event_datetime, '%Y-%m-%d') AS event_date,
  TIME_FORMAT(e.event_datetime, '%H:%i') AS event_time,
  e.location, e.purpose, e.image_path, e.ticket_price, e.charity_goal, e.current_progress,
  c.id AS category_id, c.name AS category_name, c.description AS category_description,
  o.id AS organisation_id, o.name AS organisation_name, o.mission AS organisation_mission,
  o.email AS organisation_email, o.phone AS organisation_phone, o.website AS organisation_website`;

const joins = `
  FROM charity_events e
  INNER JOIN event_categories c ON c.id = e.category_id
  INNER JOIN charitable_organisations o ON o.id = e.organisation_id`;

// Keep the suspension rule inside every public event query, including detail lookups.
const publicOnly = ' WHERE e.is_suspended = 0';

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // The round trip rejects rollover values such as 2026-02-30.
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

exports.categories = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name, description FROM event_categories ORDER BY id');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.organisations = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, mission, email, phone, website FROM charitable_organisations ORDER BY id'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT ${fields}${joins}${publicOnly} ORDER BY e.event_datetime`);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { date = '', location = '', category = '' } = req.query;
    if (date && !isValidDate(date)) {
      return res.status(400).json({ error: 'Date must be a valid YYYY-MM-DD value' });
    }
    if (location.length > 100) {
      return res.status(400).json({ error: 'Location filter is too long' });
    }
    if (category && !/^\d+$/.test(category)) {
      return res.status(400).json({ error: 'Category must be a numeric ID' });
    }
    const values = [];
    let sql = `SELECT ${fields}${joins}${publicOnly}`;

    if (date) {
      sql += ' AND DATE(e.event_datetime) = ?';
      values.push(date);
    }
    if (location) {
      sql += ' AND e.location LIKE ?';
      values.push(`%${location}%`);
    }
    if (category) {
      sql += ' AND c.id = ?';
      values.push(category);
    }

    sql += ' ORDER BY e.event_datetime';
    const [rows] = await db.query(sql, values);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ error: 'Event ID must be numeric' });
    }
    const [rows] = await db.query(`SELECT ${fields}${joins}${publicOnly} AND e.id = ?`, [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};
