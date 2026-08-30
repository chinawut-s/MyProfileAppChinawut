require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(cors());
app.use(express.json());

// ==================================================
// DATABASE
// ==================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ==================================================
// TEST API
// ==================================================

app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
  });
});

// ==================================================
// AUTHORIZATION
// ตรวจสอบสิทธิ์แบบธรรมดา
// ==================================================

function requireLogin(req, res, next) {
  const username = req.headers['x-username'];
  const role = req.headers['x-role'];

  console.log('=================================');
  console.log('CHECK LOGIN');
  console.log('USERNAME:', username);
  console.log('ROLE:', role);

  if (!username || !role) {
    return res.status(401).json({
      message: 'กรุณาเข้าสู่ระบบก่อน',
    });
  }

  if (role !== 'admin' && role !== 'user') {
    return res.status(403).json({
      message: 'สิทธิ์ผู้ใช้งานไม่ถูกต้อง',
    });
  }

  req.auth = {
    username,
    role,
  };

  next();
}

// ==================================================
// ADMIN ONLY
// ==================================================

function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({
      message: 'กรุณาเข้าสู่ระบบก่อน',
    });
  }

  if (req.auth.role !== 'admin') {
    return res.status(403).json({
      message: 'คุณไม่มีสิทธิ์ใช้งานส่วนนี้',
    });
  }

  next();
}

// ==================================================
// LOGIN
// POST /api/login
// ==================================================

app.post('/api/login', async (req, res) => {
  try {
    console.log('=================================');
    console.log('LOGIN');

    const { username, password } = req.body;

    console.log('USERNAME:', username);

    // ----------------------------------------------
    // ตรวจสอบข้อมูล
    // ----------------------------------------------

    if (!username || !password) {
      return res.status(400).json({
        message: 'กรุณากรอก Username และ Password',
      });
    }

    // ----------------------------------------------
    // ค้นหา User
    // ----------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        id,
        username,
        password,
        role
      FROM users
      WHERE username = ?
      LIMIT 1
      `,
      [username.trim()]
    );

    // ----------------------------------------------
    // ไม่พบ User
    // ----------------------------------------------

    if (rows.length === 0) {
      return res.status(401).json({
        message: 'Username หรือ Password ไม่ถูกต้อง',
      });
    }

    const user = rows[0];

    // ----------------------------------------------
    // ตรวจ Password
    // ----------------------------------------------

    if (password !== user.password) {
      return res.status(401).json({
        message: 'Username หรือ Password ไม่ถูกต้อง',
      });
    }

    // ----------------------------------------------
    // ตรวจ Role
    // ----------------------------------------------

    if (
      user.role !== 'admin' &&
      user.role !== 'user'
    ) {
      return res.status(403).json({
        message: 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งานระบบ',
      });
    }

    // ----------------------------------------------
    // LOGIN SUCCESS
    // ----------------------------------------------

    console.log(
      'LOGIN SUCCESS:',
      user.username
    );

    console.log(
      'ROLE:',
      user.role
    );

    return res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',

      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      'LOGIN ERROR:',
      error
    );

    return res.status(500).json({
      message: 'เข้าสู่ระบบไม่สำเร็จ',
      error: error.message,
    });
  }
});

// ==================================================
// GET PRODUCTS
// User + Admin ใช้ได้
// GET /api/products
// ==================================================

app.get(
  '/api/products',
  requireLogin,
  async (req, res) => {
    try {
      console.log('=================================');
      console.log('GET PRODUCTS');

      console.log(
        'USERNAME:',
        req.auth.username
      );

      console.log(
        'ROLE:',
        req.auth.role
      );

      const [rows] = await pool.query(`
        SELECT *
        FROM inventory
        ORDER BY id DESC
      `);

      console.log(
        'จำนวนสินค้า:',
        rows.length
      );

      return res.status(200).json(rows);

    } catch (error) {
      console.error(
        'GET PRODUCTS ERROR:',
        error
      );

      return res.status(500).json({
        message: 'Database error',
        error: error.message,
      });
    }
  }
);

// ==================================================
// GET PRODUCT BY ID
// User + Admin ใช้ได้
// GET /api/products/:id
// ==================================================

app.get(
  '/api/products/:id',
  requireLogin,
  async (req, res) => {
    try {
      console.log('=================================');
      console.log('GET PRODUCT BY ID');

      const id = Number(
        req.params.id
      );

      console.log(
        'PRODUCT ID:',
        id
      );

      console.log(
        'USERNAME:',
        req.auth.username
      );

      console.log(
        'ROLE:',
        req.auth.role
      );

      // ----------------------------------------------
      // ตรวจ ID
      // ----------------------------------------------

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message: 'รหัสสินค้าไม่ถูกต้อง',
        });
      }

      // ----------------------------------------------
      // ค้นหาสินค้า
      // ----------------------------------------------

      const [rows] = await pool.query(
        `
        SELECT *
        FROM inventory
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      // ----------------------------------------------
      // ไม่พบสินค้า
      // ----------------------------------------------

      if (rows.length === 0) {
        return res.status(404).json({
          message: 'ไม่พบสินค้านี้',
          id: id,
        });
      }

      return res.status(200).json(
        rows[0]
      );

    } catch (error) {
      console.error(
        'GET PRODUCT BY ID ERROR:',
        error
      );

      return res.status(500).json({
        message: 'Database error',
        error: error.message,
      });
    }
  }
);

// ==================================================
// POST PRODUCT
// ADMIN ONLY
// POST /api/products
// ==================================================

app.post(
  '/api/products',
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      console.log('=================================');
      console.log('POST PRODUCT');

      console.log(
        'ADMIN:',
        req.auth.username
      );

      console.log(
        'ROLE:',
        req.auth.role
      );

      const {
        name,
        model,
        color,
        price,
        stock,
        description,
        image_url,
      } = req.body;

      console.log(
        'DATA:',
        req.body
      );

      // ----------------------------------------------
      // ตรวจข้อมูล
      // ----------------------------------------------

      if (
        !name ||
        !model ||
        !color ||
        price === undefined ||
        stock === undefined
      ) {
        return res.status(400).json({
          message:
            'กรุณากรอกข้อมูลสินค้าให้ครบ',
        });
      }

      // ----------------------------------------------
      // แปลงตัวเลข
      // ----------------------------------------------

      const priceNumber =
        Number(price);

      const stockNumber =
        Number(stock);

      if (
        Number.isNaN(priceNumber)
      ) {
        return res.status(400).json({
          message:
            'ราคาสินค้าต้องเป็นตัวเลข',
        });
      }

      if (
        Number.isNaN(stockNumber)
      ) {
        return res.status(400).json({
          message:
            'จำนวนสินค้าต้องเป็นตัวเลข',
        });
      }

      // ----------------------------------------------
      // INSERT
      // ----------------------------------------------

      const [result] =
        await pool.query(
          `
          INSERT INTO inventory
          (
            name,
            model,
            color,
            price,
            stock,
            description,
            image_url
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            name.trim(),
            model.trim(),
            color.trim(),
            priceNumber,
            stockNumber,
            description
              ? description.trim()
              : '',
            image_url
              ? image_url.trim()
              : '',
          ]
        );

      console.log(
        'NEW PRODUCT ID:',
        result.insertId
      );

      return res.status(201).json({
        message:
          'เพิ่มสินค้าเรียบร้อยแล้ว',
        id: result.insertId,
      });

    } catch (error) {
      console.error(
        'ADD PRODUCT ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'เพิ่มสินค้าไม่สำเร็จ',
        error: error.message,
      });
    }
  }
);

// ==================================================
// PUT PRODUCT
// ADMIN ONLY
// PUT /api/products/:id
// ==================================================

app.put(
  '/api/products/:id',
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      console.log('=================================');
      console.log('PUT PRODUCT');

      const id = Number(
        req.params.id
      );

      console.log(
        'EDIT PRODUCT ID:',
        id
      );

      console.log(
        'ADMIN:',
        req.auth.username
      );

      console.log(
        'ROLE:',
        req.auth.role
      );

      console.log(
        'EDIT DATA:',
        req.body
      );

      // ----------------------------------------------
      // ตรวจ ID
      // ----------------------------------------------

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'รหัสสินค้าไม่ถูกต้อง',
        });
      }

      const {
        name,
        model,
        color,
        price,
        stock,
        description,
        image_url,
      } = req.body;

      // ----------------------------------------------
      // ตรวจข้อมูล
      // ----------------------------------------------

      if (
        !name ||
        !model ||
        !color ||
        price === undefined ||
        stock === undefined
      ) {
        return res.status(400).json({
          message:
            'กรุณากรอกข้อมูลสินค้าให้ครบ',
        });
      }

      // ----------------------------------------------
      // แปลงตัวเลข
      // ----------------------------------------------

      const priceNumber =
        Number(price);

      const stockNumber =
        Number(stock);

      if (
        Number.isNaN(priceNumber)
      ) {
        return res.status(400).json({
          message:
            'ราคาสินค้าต้องเป็นตัวเลข',
        });
      }

      if (
        Number.isNaN(stockNumber)
      ) {
        return res.status(400).json({
          message:
            'จำนวนสินค้าต้องเป็นตัวเลข',
        });
      }

      // ----------------------------------------------
      // ตรวจว่ามีสินค้า
      // ----------------------------------------------

      const [checkRows] =
        await pool.query(
          `
          SELECT id
          FROM inventory
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (
        checkRows.length === 0
      ) {
        return res.status(404).json({
          message:
            'ไม่พบสินค้าที่ต้องการแก้ไข',
        });
      }

      // ----------------------------------------------
      // UPDATE
      // ----------------------------------------------

      const [result] =
        await pool.query(
          `
          UPDATE inventory
          SET
            name = ?,
            model = ?,
            color = ?,
            price = ?,
            stock = ?,
            description = ?,
            image_url = ?
          WHERE id = ?
          `,
          [
            name.trim(),
            model.trim(),
            color.trim(),
            priceNumber,
            stockNumber,
            description
              ? description.trim()
              : '',
            image_url
              ? image_url.trim()
              : '',
            id,
          ]
        );

      console.log(
        'UPDATE AFFECTED ROWS:',
        result.affectedRows
      );

      return res.status(200).json({
        message:
          'แก้ไขสินค้าเรียบร้อยแล้ว',
        id: id,
      });

    } catch (error) {
      console.error(
        'UPDATE PRODUCT ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'แก้ไขสินค้าไม่สำเร็จ',
        error: error.message,
      });
    }
  }
);

// ==================================================
// DELETE PRODUCT
// ADMIN ONLY
// DELETE /api/products/:id
// ==================================================

app.delete(
  '/api/products/:id',
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      console.log('=================================');
      console.log('DELETE PRODUCT');

      const id = Number(
        req.params.id
      );

      console.log(
        'DELETE PRODUCT ID:',
        id
      );

      console.log(
        'ADMIN:',
        req.auth.username
      );

      console.log(
        'ROLE:',
        req.auth.role
      );

      // ----------------------------------------------
      // ตรวจ ID
      // ----------------------------------------------

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          message:
            'รหัสสินค้าไม่ถูกต้อง',
        });
      }

      // ----------------------------------------------
      // ตรวจว่าสินค้ามีอยู่
      // ----------------------------------------------

      const [checkRows] =
        await pool.query(
          `
          SELECT id
          FROM inventory
          WHERE id = ?
          LIMIT 1
          `,
          [id]
        );

      if (
        checkRows.length === 0
      ) {
        return res.status(404).json({
          message:
            'ไม่พบสินค้าที่ต้องการลบ',
          id: id,
        });
      }

      // ----------------------------------------------
      // DELETE
      // ----------------------------------------------

      const [result] =
        await pool.query(
          `
          DELETE FROM inventory
          WHERE id = ?
          `,
          [id]
        );

      console.log(
        'DELETE AFFECTED ROWS:',
        result.affectedRows
      );

      return res.status(200).json({
        message:
          'ลบสินค้าเรียบร้อยแล้ว',
        id: id,
      });

    } catch (error) {
      console.error(
        'DELETE PRODUCT ERROR:',
        error
      );

      return res.status(500).json({
        message:
          'ลบสินค้าไม่สำเร็จ',
        error: error.message,
      });
    }
  }
);

// ==================================================
// START SERVER
// ==================================================

const PORT =
  process.env.PORT || 3055;

app.listen(
  PORT,
  () => {
    console.log(
      '================================='
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `API: http://119.59.102.161:${PORT}/api`
    );

    console.log(
      '================================='
    );
  }
);