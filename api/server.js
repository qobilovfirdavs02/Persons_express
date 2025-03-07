// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const { Pool } = require('@neondatabase/serverless');
// const cloudinary = require('cloudinary').v2;
// const bcrypt = require('bcrypt');
// const { Pool } = require('pg');

// const app = express();

// // Middleware
// app.use(cors()); // React frontenddan so‘rovlarni qabul qilish uchun
// app.use(express.json()); // JSON so‘rovlarni parse qilish uchun



// // Neon Postgres ulanishi
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// // Cloudinary sozlamalari
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Bazaga ulanishni tekshirish
// async function checkDatabaseConnection() {
//   try {
//     await pool.query('SELECT NOW()');
//     console.log('Database connected successfully!');
//   } catch (error) {
//     console.error('Database connection failed:', error.message);
//   }
// }
// checkDatabaseConnection();

// // Test endpointi (server ishlayotganini tekshirish uchun)
// app.get('/', (req, res) => {
//   res.send('Server is running locally!');
// });

// // Admin autentifikatsiyasi
// app.post('/api/admin/login', async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
//     if (result.rows.length === 0) {
//       return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
//     }
//     const admin = result.rows[0];
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: 'Parol noto‘g‘ri' });
//     }
//     res.json({ message: 'Muvaffaqiyatli kirish', adminId: admin.id });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Server xatosi' });
//   }
// });

// // Admin ma'lumotlarini olish
// app.get('/api/admin/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const query = 'SELECT * FROM admins WHERE id = $1';
//     const result = await pool.query(query, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Get admin error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Admin ma'lumotlarini yangilash
// app.put('/api/admin/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { username, password } = req.body;

//     let hashedPassword = null;
//     if (password) {
//       const saltRounds = 10;
//       hashedPassword = await bcrypt.hash(password, saltRounds);
//     }

//     const query = `
//       UPDATE admins 
//       SET username = COALESCE($1, username),
//           password = COALESCE($2, password)
//       WHERE id = $3
//       RETURNING *
//     `;
//     const values = [username || null, hashedPassword || null, id];

//     const result = await pool.query(query, values);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Admin not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Update admin error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Foydalanuvchilarni izlash (loglar bilan)
// app.get('/api/users/search', async (req, res) => {
//   try {
//     const { name, surname, passport_id } = req.query;
//     const searchTerm = name || surname || passport_id || '';
//     const query = `
//       SELECT p.*, ul.admin_id, ul.action, ul.action_date, ul.reason as log_reason
//       FROM persons p
//       LEFT JOIN user_logs ul ON p.id = ul.user_id
//       WHERE p.first_name ILIKE $1
//          OR p.last_name ILIKE $1
//          OR p.passport_id ILIKE $1
//       ORDER BY ul.action_date DESC
//     `;
//     const values = [`%${searchTerm}%`];
//     const result = await pool.query(query, values);
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Search error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Bitta foydalanuvchi ma'lumotlarini olish
// app.get('/api/users/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const query = `
//       SELECT p.*, ul.admin_id, ul.action, ul.action_date, ul.reason as log_reason
//       FROM persons p
//       LEFT JOIN user_logs ul ON p.id = ul.user_id
//       WHERE p.id = $1
//     `;
//     const result = await pool.query(query, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Get user error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Yangi foydalanuvchi qo'shish (log bilan)
// app.post('/api/users', async (req, res) => {
//   try {
//     const {
//       first_name, last_name, middle_name, passport_id, phone_number, address,
//       nationality, birth_place, citizenship, birth_date, image_url, status,
//       wanted_reason, reason, adminId
//     } = req.body;

//     if (!first_name || !last_name || !passport_id) {
//       return res.status(400).json({ error: 'Required fields missing' });
//     }

//     const query = `
//       INSERT INTO persons (first_name, last_name, middle_name, passport_id, phone_number, address,
//         nationality, birth_place, citizenship, birth_date, image_url, status, wanted_reason, reason)
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
//       RETURNING *
//     `;
//     const values = [
//       first_name, last_name, middle_name, passport_id, phone_number, address,
//       nationality, birth_place, citizenship, birth_date, image_url, status || 'clean',
//       wanted_reason, reason
//     ];

//     const result = await pool.query(query, values);
//     const userId = result.rows[0].id;

//     // Log qo‘shish
//     await pool.query(
//       'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
//       [userId, adminId, 'created', reason]
//     );

//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error('Add user error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Foydalanuvchi ma'lumotlarini yangilash (log bilan)
// app.put('/api/users/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       first_name, last_name, middle_name, passport_id, phone_number, address,
//       nationality, birth_place, citizenship, birth_date, image_url, status,
//       wanted_reason, reason, adminId
//     } = req.body;

//     const query = `
//       UPDATE persons 
//       SET first_name = $1, last_name = $2, middle_name = $3, passport_id = $4, phone_number = $5,
//           address = $6, nationality = $7, birth_place = $8, citizenship = $9, birth_date = $10,
//           image_url = $11, status = $12, wanted_reason = $13, reason = $14
//       WHERE id = $15
//       RETURNING *
//     `;
//     const values = [
//       first_name, last_name, middle_name, passport_id, phone_number, address,
//       nationality, birth_place, citizenship, birth_date, image_url, status || 'clean',
//       wanted_reason, reason, id
//     ];

//     const result = await pool.query(query, values);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Log qo‘shish
//     await pool.query(
//       'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
//       [id, adminId, 'updated', reason]
//     );

//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Update user error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Foydalanuvchini o'chirish (log bilan)
// app.delete('/api/users/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { adminId, reason } = req.body;

//     // 1. Avval log qo‘shish
//     await pool.query(
//       'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
//       [id, adminId, 'deleted', reason]
//     );

//     // 2. Keyin foydalanuvchini o‘chirish
//     const query = 'DELETE FROM persons WHERE id = $1 RETURNING *';
//     const result = await pool.query(query, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ message: 'User deleted successfully' });
//   } catch (error) {
//     console.error('Delete user error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Cloudinary rasm yuklash
// app.post('/api/upload-image', async (req, res) => {
//   try {
//     const { image } = req.body;
//     const result = await cloudinary.uploader.upload(image, {
//       folder: 'usersearch',
//     });
//     res.json({ url: result.secure_url });
//   } catch (error) {
//     console.error('Image upload error:', error.message);
//     res.status(500).json({ error: 'Image upload failed', details: error.message });
//   }
// });




// // Yangilik qo'shish
// app.post('/api/news', async (req, res) => {
//   try {
//     const { title, content, image_url, video_url, adminId } = req.body;
//     const query = `
//       INSERT INTO news (title, content, image_url, video_url, admin_id)
//       VALUES ($1, $2, $3, $4, $5)
//       RETURNING *
//     `;
//     const values = [title, content, image_url || null, video_url || null, adminId];
//     const result = await pool.query(query, values);
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     console.error('Add news error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Barcha yangiliklarni olish
// app.get('/api/news', async (req, res) => {
//   try {
//     const query = 'SELECT * FROM news ORDER BY created_at DESC';
//     const result = await pool.query(query);
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Get news error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });


// // server.js
// app.put('/api/news/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, content, image_url, video_url } = req.body;
//     const query = `
//       UPDATE news 
//       SET title = $1, content = $2, image_url = $3, video_url = $4
//       WHERE id = $5
//       RETURNING *
//     `;
//     const values = [title, content, image_url || null, video_url || null, id];
//     const result = await pool.query(query, values);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'News not found' });
//     }
//     res.json(result.rows[0]);
//   } catch (error) {
//     console.error('Update news error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });

// // Yangilikni o'chirish
// app.delete('/api/news/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const query = 'DELETE FROM news WHERE id = $1 RETURNING *';
//     const result = await pool.query(query, [id]);
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'News not found' });
//     }
//     res.json({ message: 'News deleted successfully' });
//   } catch (error) {
//     console.error('Delete news error:', error.message);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// });


// // Serverni ishga tushirish
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running locally on port ${PORT}`);
// });

// module.exports = app;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');

const app = express();

// Middleware
app.use(cors({ origin: 'https://persons-react.vercel.app' }));

app.use(express.json()); // JSON so‘rovlarni parse qilish uchun

// Neon Postgres ulanishi
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Cloudinary sozlamalari
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Bazaga ulanishni tekshirish
async function checkDatabaseConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}
checkDatabaseConnection();

// Test endpointi
app.get('/', (req, res) => {
  res.send('Server is running on Vercel!');
});

// Admin autentifikatsiyasi
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    }
    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Parol noto‘g‘ri' });
    }
    res.json({ message: 'Muvaffaqiyatli kirish', adminId: admin.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Admin ma'lumotlarini olish
app.get('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM admins WHERE id = $1';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get admin error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Admin ma'lumotlarini yangilash
app.put('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    let hashedPassword = null;
    if (password) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    const query = `
      UPDATE admins 
      SET username = COALESCE($1, username),
          password = COALESCE($2, password)
      WHERE id = $3
      RETURNING *
    `;
    const values = [username || null, hashedPassword || null, id];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update admin error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Foydalanuvchilarni izlash (loglar bilan)
app.get('/api/users/search', async (req, res) => {
  try {
    const { name, surname, passport_id } = req.query;
    const searchTerm = name || surname || passport_id || '';
    const query = `
      SELECT p.*, ul.admin_id, ul.action, ul.action_date, ul.reason as log_reason
      FROM persons p
      LEFT JOIN user_logs ul ON p.id = ul.user_id
      WHERE p.first_name ILIKE $1
         OR p.last_name ILIKE $1
         OR p.passport_id ILIKE $1
      ORDER BY ul.action_date DESC
    `;
    const values = [`%${searchTerm}%`];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Bitta foydalanuvchi ma'lumotlarini olish
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT p.*, ul.admin_id, ul.action, ul.action_date, ul.reason as log_reason
      FROM persons p
      LEFT JOIN user_logs ul ON p.id = ul.user_id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Yangi foydalanuvchi qo'shish (log bilan)
app.post('/api/users', async (req, res) => {
  try {
    const {
      first_name, last_name, middle_name, passport_id, phone_number, address,
      nationality, birth_place, citizenship, birth_date, image_url, status,
      wanted_reason, reason, adminId
    } = req.body;

    if (!first_name || !last_name || !passport_id) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const query = `
      INSERT INTO persons (first_name, last_name, middle_name, passport_id, phone_number, address,
        nationality, birth_place, citizenship, birth_date, image_url, status, wanted_reason, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      first_name, last_name, middle_name, passport_id, phone_number, address,
      nationality, birth_place, citizenship, birth_date, image_url, status || 'clean',
      wanted_reason, reason
    ];

    const result = await pool.query(query, values);
    const userId = result.rows[0].id;

    // Log qo‘shish
    await pool.query(
      'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
      [userId, adminId, 'created', reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Foydalanuvchi ma'lumotlarini yangilash (log bilan)
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, middle_name, passport_id, phone_number, address,
      nationality, birth_place, citizenship, birth_date, image_url, status,
      wanted_reason, reason, adminId
    } = req.body;

    const query = `
      UPDATE persons 
      SET first_name = $1, last_name = $2, middle_name = $3, passport_id = $4, phone_number = $5,
          address = $6, nationality = $7, birth_place = $8, citizenship = $9, birth_date = $10,
          image_url = $11, status = $12, wanted_reason = $13, reason = $14
      WHERE id = $15
      RETURNING *
    `;
    const values = [
      first_name, last_name, middle_name, passport_id, phone_number, address,
      nationality, birth_place, citizenship, birth_date, image_url, status || 'clean',
      wanted_reason, reason, id
    ];

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log qo‘shish
    await pool.query(
      'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
      [id, adminId, 'updated', reason]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Foydalanuvchini o'chirish (log bilan)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, reason } = req.body;

    // 1. Avval log qo‘shish
    await pool.query(
      'INSERT INTO user_logs (user_id, admin_id, action, reason) VALUES ($1, $2, $3, $4)',
      [id, adminId, 'deleted', reason]
    );

    // 2. Keyin foydalanuvchini o‘chirish
    const query = 'DELETE FROM persons WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Cloudinary rasm yuklash
app.post('/api/upload-image', async (req, res) => {
  try {
    const { image } = req.body;
    const result = await cloudinary.uploader.upload(image, {
      folder: 'usersearch',
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Image upload error:', error.message);
    res.status(500).json({ error: 'Image upload failed', details: error.message });
  }
});

// Yangilik qo'shish
app.post('/api/news', async (req, res) => {
  try {
    const { title, content, image_url, video_url, adminId } = req.body;
    const query = `
      INSERT INTO news (title, content, image_url, video_url, admin_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [title, content, image_url || null, video_url || null, adminId];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add news error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Barcha yangiliklarni olish
app.get('/api/news', async (req, res) => {
  try {
    const query = 'SELECT * FROM news ORDER BY created_at DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Get news error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Yangilikni yangilash
app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url, video_url } = req.body;
    const query = `
      UPDATE news 
      SET title = $1, content = $2, image_url = $3, video_url = $4
      WHERE id = $5
      RETURNING *
    `;
    const values = [title, content, image_url || null, video_url || null, id];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update news error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Yangilikni o'chirish
app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM news WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Vercel uchun eksport
module.exports = app;