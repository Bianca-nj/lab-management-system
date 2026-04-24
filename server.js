require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt:', username);

    // Permanent hardcoded credentials (cannot be changed)
   if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true, redirectUrl: '/dashboard.html', username: 'Admin' });
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            res.json({ success: true, redirectUrl: '/dashboard.html', username: user.username });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Add new user
app.post('/users', async (req, res) => {
    const { username, password, phone } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO users (username, password, phone_number) VALUES (?, ?, ?)';
        db.query(sql, [username, hashedPassword, phone], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error adding user' });
            }
            res.json({ message: 'User added successfully' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error encrypting password' });
    }
});
app.get('/users', (req, res) => {
    db.query('SELECT username, phone_number FROM users', (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ message: 'Database error' });
      }
  
      res.json(results);
    });
  });
  

// Update user
app.put('/users/:username', async (req, res) => {
    const oldUsername = req.params.username;
    const { username: newUsername, password, phone } = req.body;

    try {
        const fields = [];
        const values = [];

        if (newUsername) {
            fields.push('username = ?');
            values.push(newUsername);
        }

        if (phone) {
            fields.push('phone_number = ?');
            values.push(phone);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE username = ?`;
        values.push(oldUsername);

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ message: 'Error updating user' });
            res.json({ message: 'User updated successfully' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});


  
// Delete User
app.delete('/users/:username', (req, res) => {
    const { username } = req.params;
    const sql = 'DELETE FROM users WHERE username = ?';
    
    db.query(sql, [username], (err, result) => { // Fixed: db.query instead of connection.query
        if (err) return res.status(500).json({ message: 'Error deleting user' });
        res.json({ message: 'User deleted successfully' });
    });
});

// Add item
app.post('/api/items', (req, res) => {
    const { item, itemName } = req.body;
    const sql = 'INSERT INTO items (item, item_name) VALUES (?, ?)';
    db.query(sql, [item, itemName], (err, result) => {
      if (err) return res.status(500).json({ message: 'Error adding item' });
      res.json({ message: 'Item added successfully' });
    });
  });
  
  // Get all items
  app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
      if (err) return res.status(500).json({ message: 'Error fetching items' });
      res.json(results);
    });
  });
  
  // Delete item
  app.delete('/api/items/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM items WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ message: 'Error deleting item' });
      res.json({ message: 'Item deleted successfully' });
    });
  });
  
  //borrower
  app.post("/add-borrower", (req, res) => {
    const { name, item, itemName, timeGiven } = req.body;
    const sql = "INSERT INTO borrowers (name, item, itemName, timeGiven) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, item, itemName, timeGiven], (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
  });
  
  app.get("/borrowers", (req, res) => {
    db.query("SELECT * FROM borrowers", (err, results) => {
      if (err) return res.status(500).json([]);
      res.json(results);
    });
  });
  
  app.put("/update-return/:id", (req, res) => {
    const { returnTime } = req.body;
    db.query(
      "UPDATE borrowers SET returnTime = ? WHERE id = ?",
      [returnTime, req.params.id],
      (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
      }
    );
  });
  
 // Update time given
app.put("/update-timegiven/:id", (req, res) => {
  const { timeGiven } = req.body;
  db.query(
    "UPDATE borrowers SET timeGiven = ? WHERE id = ?",
    [timeGiven, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

 // Get all floors
app.get('/floors', (req, res) => {
    db.query('SELECT * FROM floors', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Add a floor
app.post('/floors', (req, res) => {
    const { name } = req.body;
    db.query('INSERT INTO floors (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, name });
    });
});

// Delete a floor
app.delete('/floors/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM floors WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).send(err);
        res.sendStatus(200);
    });
});

// Add a lab
app.post('/api/labs', (req, res) => {
  const { name, floor_id } = req.body;
  if (!name || !floor_id) {
    return res.status(400).json({ message: 'Lab name and floor ID are required' });
  }

  const sql = 'INSERT INTO labs (name, floor_id) VALUES (?, ?)';
  db.query(sql, [name, floor_id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error adding lab' });
    res.json({ message: 'Lab added successfully', id: result.insertId });
  });
});

// Get all labs with number of computers
app.get('/api/labs', (req, res) => {
  const query = `
    SELECT l.*, COUNT(c.id) AS computer_count
    FROM labs l
    LEFT JOIN computers c ON l.id = c.lab_id
    GROUP BY l.id
  `;
  db.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Get labs for a floor
app.get('/api/labs/:floor_id', (req, res) => {
  const { floor_id } = req.params;

  const sql = 'SELECT * FROM labs WHERE floor_id = ?';
  db.query(sql, [floor_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching labs' });
    res.json(results);
  });
});

// Delete lab
app.delete('/api/labs/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM labs WHERE id = ?';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting lab' });
    res.json({ message: 'Lab deleted successfully' });
  });
});

// Get all computers for a specific lab
app.get('/api/computers/:labId', (req, res) => {
  const labId = req.params.labId;
  db.query('SELECT * FROM computers WHERE lab_id = ?', [labId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// Add a new computer
app.post('/api/computers', (req, res) => {
  const { lab_id, specs, comment, side, position, os, status } = req.body;
  const query = 'INSERT INTO computers (lab_id, specs, comment, side, position, os, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [lab_id, specs, comment, side, position, os || 'Windows 10', status || 'Working'], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ id: result.insertId });
  });
});


//Delete computer
app.delete('/api/computers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM computers WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Error deleting computer' });
    res.json({ message: 'Computer deleted successfully' });
  });
});

// Update an existing computer
app.put('/api/computers/:id', (req, res) => {
  const { id } = req.params;
  const { specs, comment, side, position, os, status } = req.body;

  const query = `
    UPDATE computers 
    SET specs = ?, comment = ?, side = ?, position = ?, os = ?, status = ?
    WHERE id = ?
  `;

  db.query(query, [specs, comment, side, position, os, status, id], (err, result) => {
    if (err) {
      console.error('Error updating computer:', err);
      return res.status(500).json({ message: 'Error updating computer' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Computer not found' });
    }
    res.json({ message: 'Computer updated successfully' });
  });
});

// Post a new message/issue
app.post('/api/messages', (req, res) => {
  const { sender, content, lab_reference } = req.body;
  if (!sender || !content) return res.status(400).json({ message: 'Sender and content required' });

  const sql = 'INSERT INTO messages (sender, content, lab_reference, status) VALUES (?, ?, ?, "Open")';
  db.query(sql, [sender, content, lab_reference || null], (err) => {
    if (err) return res.status(500).json({ message: 'Error saving message' });
    res.status(201).json({ message: 'Issue submitted' });
  });
});

// Get all messages
app.get('/api/messages', (req, res) => {
  db.query('SELECT * FROM messages ORDER BY created_at DESC', (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Reply to a message
app.put('/api/messages/:id/reply', (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  db.query('UPDATE messages SET reply = ? WHERE id = ?', [reply, id], (err) => {
    if (err) return res.status(500).json({ message: 'Error saving reply' });
    res.json({ message: 'Reply saved' });
  });
});

// Resolve an issue
app.put('/api/messages/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { resolved_by, resolved_at } = req.body;
  const sql = 'UPDATE messages SET status = "Resolved", resolved_by = ?, resolved_at = ? WHERE id = ?';
  db.query(sql, [resolved_by, resolved_at, id], (err) => {
    if (err) return res.status(500).json({ message: 'Error resolving issue' });
    res.json({ message: 'Issue resolved' });
  });
});

// Get all borrowers
// Fix this - add id to the SELECT
app.get('/borrowers', (req, res) => {
    const query = `
      SELECT id, name, item, itemName, timeGiven, returnTime
      FROM borrowers
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching borrowers:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
