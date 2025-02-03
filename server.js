const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------
// SQLite Setup for Users
// ---------------------------
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) console.error("Error opening database", err);
  else console.log("Connected to SQLite database.");
});

// Create users table with checklist and filters fields.
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    checklist TEXT DEFAULT '{}',
    filters TEXT DEFAULT '{}'
  )
`);

// ---------------------------
// API Endpoints for Roadmap Data (Admin)
// ---------------------------

// Get roadmap data
app.get('/api/roadmap', (req, res) => {
  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading data.");
    }
    res.json(JSON.parse(data));
  });
});

// Update a section (admin only)
app.post('/api/roadmap/:buildingKey/:sectionIndex', (req, res) => {
  const { adminId, adminPassword, sectionData } = req.body;
  if (adminId !== 'admin' || adminPassword !== 'adminpass') {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const buildingKey = req.params.buildingKey;
  const sectionIndex = req.params.sectionIndex;

  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send("Error reading data.");
    let roadmap = JSON.parse(data);
    if (!roadmap[buildingKey] || !roadmap[buildingKey].sections[sectionIndex]) {
      return res.status(400).json({ error: "Invalid building or section index" });
    }
    roadmap[buildingKey].sections[sectionIndex] = { 
      ...roadmap[buildingKey].sections[sectionIndex],
      ...sectionData 
    };
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(roadmap, null, 2), (err) => {
      if (err) return res.status(500).send("Error saving data.");
      res.json({ message: "Section updated successfully", buildingData: roadmap[buildingKey] });
    });
  });
});

// Add new building (admin)
app.post('/api/roadmap/add-building', (req, res) => {
  const { buildingKey, buildingData } = req.body;
  if (!buildingKey || !buildingData) {
    return res.status(400).json({ error: 'buildingKey and buildingData are required' });
  }
  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send("Error reading data.");
    let roadmap = JSON.parse(data);
    if (roadmap[buildingKey]) {
      return res.status(400).json({ error: 'Building key already exists' });
    }
    roadmap[buildingKey] = buildingData;
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(roadmap, null, 2), (err) => {
      if (err) return res.status(500).send("Error saving data.");
      res.json({ message: "Building added successfully", roadmap });
    });
  });
});

// Add new section (admin)
app.post('/api/roadmap/:buildingKey/add-section', (req, res) => {
  const buildingKey = req.params.buildingKey;
  const { sectionData } = req.body;
  if (!sectionData) return res.status(400).json({ error: 'sectionData is required' });
  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) return res.status(500).send("Error reading data.");
    let roadmap = JSON.parse(data);
    if (!roadmap[buildingKey]) return res.status(400).json({ error: 'Invalid building key' });
    if (!roadmap[buildingKey].sections) roadmap[buildingKey].sections = [];
    roadmap[buildingKey].sections.push(sectionData);
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(roadmap, null, 2), (err) => {
      if (err) return res.status(500).send("Error saving data.");
      res.json({ message: "Section added successfully", roadmap: roadmap[buildingKey] });
    });
  });
});

// Delete a building (admin)
app.delete('/api/roadmap/:buildingKey', (req, res) => {
  const { adminId, adminPassword } = req.body;
  if (adminId !== 'admin' || adminPassword !== 'adminpass') {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const buildingKey = req.params.buildingKey;
  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading data.");
    }
    let roadmap = JSON.parse(data);
    if (!roadmap[buildingKey]) {
      return res.status(400).json({ error: 'Invalid building key' });
    }
    delete roadmap[buildingKey];
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(roadmap, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error saving data.");
      }
      res.json({ message: "Building deleted successfully", roadmap });
    });
  });
});

// Delete a section (admin)
app.delete('/api/roadmap/:buildingKey/:sectionIndex', (req, res) => {
  const { adminId, adminPassword } = req.body;
  if (adminId !== 'admin' || adminPassword !== 'adminpass') {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const buildingKey = req.params.buildingKey;
  const sectionIndex = parseInt(req.params.sectionIndex);
  fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading data.");
    }
    let roadmap = JSON.parse(data);
    if (!roadmap[buildingKey] || !roadmap[buildingKey].sections[sectionIndex]) {
      return res.status(400).json({ error: "Invalid building or section index" });
    }
    // Remove the specified section
    roadmap[buildingKey].sections.splice(sectionIndex, 1);
    fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(roadmap, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error saving data.");
      }
      res.json({ message: "Section deleted successfully", roadmap: roadmap[buildingKey] });
    });
  });
});


// ---------------------------
// API Endpoints for User Management
// ---------------------------

// User Registration
app.post('/api/user/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });
  db.run(
    "INSERT INTO users (username, password, checklist, filters) VALUES (?, ?, '{}', '{}')",
    [username, password],
    function(err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'User registered', userId: this.lastID });
    }
  );
});

// User Login
app.post('/api/user/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) {
        res.json({ message: 'Login successful', userId: row.id, checklist: JSON.parse(row.checklist || '{}'), filters: JSON.parse(row.filters || '{}') });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  );
});




// Get User Checklist
app.get('/api/user/:userId/checklist', (req, res) => {
  const userId = req.params.userId;
  db.get("SELECT checklist FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.json({ checklist: JSON.parse(row.checklist || '{}') });
    else res.status(404).json({ error: 'User not found' });
  });
});

// Update User Checklist
app.post('/api/user/:userId/checklist', (req, res) => {
  const userId = req.params.userId;
  const { checklist } = req.body;
  db.run("UPDATE users SET checklist = ? WHERE id = ?", [JSON.stringify(checklist), userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Checklist updated' });
  });
});

// Get User Filters
app.get('/api/user/:userId/filters', (req, res) => {
  const userId = req.params.userId;
  db.get("SELECT filters FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.json({ filters: JSON.parse(row.filters || '{}') });
    else res.status(404).json({ error: 'User not found' });
  });
});

// Update User Filters
app.post('/api/user/:userId/filters', (req, res) => {
  const userId = req.params.userId;
  const { filters } = req.body;
  db.run("UPDATE users SET filters = ? WHERE id = ?", [JSON.stringify(filters), userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Filters updated' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
