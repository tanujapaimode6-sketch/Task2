const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ================= DATABASE =================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "groupdb",
  port: '3307'
});

db.connect((err) => {
  if (err) {
    console.log("❌ MySQL Connection Failed:", err);
  } else {
    console.log("✅ MySQL Connected");
  }
});

// ================= PROMISE QUERY =================
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        console.log("SQL ERROR:", err.sqlMessage);
        reject(err);
      } else resolve(result);
    });
  });

/* =================================================
   GROUPS
================================================= */
app.post("/groups", async (req, res) => {
  try {
    await query(
      "INSERT INTO groups(group_name,is_active) VALUES(?,1)",
      [req.body.group_name]
    );
    res.json({ message: "Group added" });
  } catch (err) {
    res.status(500).json({ error: "Group insert failed" });
  }
});

app.get("/groups", async (req, res) => {
  try {
    const result = await query("SELECT * FROM groups WHERE is_active=1");
    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

/* =================================================
   CHAINS
================================================= */
app.post("/chains", async (req, res) => {
  try {
    const { company_name, gstn_no, group_id } = req.body;

    await query(
      "INSERT INTO chains(company_name,gstn_no,group_id,is_active) VALUES(?,?,?,1)",
      [company_name, gstn_no, group_id]
    );

    res.json({ message: "Chain added" });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/chains", async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, g.group_name
      FROM chains c
      LEFT JOIN groups g ON c.group_id = g.group_id
      WHERE c.is_active=1
    `);

    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.put("/chains/:id", async (req, res) => {
  try {
    const { company_name, gstn_no, group_id } = req.body;

    await query(
      "UPDATE chains SET company_name=?, gstn_no=?, group_id=? WHERE chain_id=?",
      [company_name, gstn_no, group_id, req.params.id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.patch("/chains/:id/delete", async (req, res) => {
  try {
    await query(
      "UPDATE chains SET is_active=0 WHERE chain_id=?",
      [req.params.id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

/* =================================================
   BRANDS (FIXED - IMPORTANT)
================================================= */
// ================= BRANDS =================

// ================= BRANDS =================

// ADD BRAND
app.post("/brands", async (req, res) => {
  try {
    const { brand_name, chain_id } = req.body;

    if(!brand_name || !chain_id){
      return res.status(400).json({ message: "All fields required" });
    }

    await query(
      "INSERT INTO brands(brand_name, chain_id, is_active) VALUES(?,?,1)",
      [brand_name, chain_id]
    );

    res.json({ message: "Brand added" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Insert failed" });
  }
});


// GET BRANDS
app.get("/brands", async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        b.brand_id,
        b.brand_name,
        b.chain_id,
        c.company_name
      FROM brands b
      JOIN chains c ON b.chain_id = c.chain_id
      WHERE b.is_active = 1
      ORDER BY b.brand_id DESC
    `);

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Fetch failed" });
  }
});


// UPDATE BRAND ✅ FIXED
app.put("/brands/:id", async (req, res) => {
  try {

    const { brand_name, chain_id } = req.body;

    const result = await query(
      "UPDATE brands SET brand_name=?, chain_id=?, updated_at=NOW() WHERE brand_id=?",
      [brand_name, chain_id, req.params.id]
    );

    if(result.affectedRows === 0){
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({ message: "Updated successfully" });

  } catch (err) {
    console.log("❌ UPDATE ERROR:", err.sqlMessage);
    res.status(500).json({ message: err.sqlMessage });
  }
});

// DELETE BRAND ✅ FIXED
app.patch("/brands/:id/delete", async (req, res) => {
  try {

    const id = Number(req.params.id);

    const result = await query(
      "UPDATE brands SET is_active=0, updated_at=NOW() WHERE brand_id=?",
      [id]
    );

    if(result.affectedRows === 0){
      return res.status(404).json({ message: "Brand not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.log("❌ DELETE ERROR:", err.sqlMessage);
    res.status(500).json({ message: err.sqlMessage });
  }
});
// ================= ZONES =================

// GET ZONES (with brand + company)
app.get("/zones", async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        z.zone_id,
        z.zone_name,
        z.brand_id,
        b.brand_name,
        c.company_name,
        z.created_at,
        z.updated_at
      FROM zones z
      JOIN brands b ON z.brand_id = b.brand_id
      JOIN chains c ON b.chain_id = c.chain_id
      WHERE z.is_active = 1
      ORDER BY z.zone_id DESC
    `);

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ADD ZONE
// ================= ADD ZONE =================
app.post("/zones", async (req, res) => {
  try {
    const { zone_name, brand_id } = req.body;

    if(!zone_name || !brand_id){
      return res.status(400).json({ message: "All fields required" });
    }

    await query(
      "INSERT INTO zones(zone_name, brand_id, is_active, created_at) VALUES(?,?,1,NOW())",
      [zone_name, brand_id]
    );

    res.json({ message: "Zone Added Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// UPDATE ZONE
app.put("/zones/:id", async (req, res) => {
  try {
    const { zone_name, brand_id } = req.body;

    await query(
      "UPDATE zones SET zone_name=?, brand_id=?, updated_at=NOW() WHERE zone_id=?",
      [zone_name, brand_id, req.params.id]
    );

    res.json({ message: "Zone Updated" });

  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE ZONE (SOFT DELETE)
app.patch("/zones/:id/delete", async (req, res) => {
  try {
    await query(
      "UPDATE zones SET is_active=0 WHERE zone_id=?",
      [req.params.id]
    );

    res.json({ message: "Zone Deleted" });

  } catch (err) {
    res.status(500).json(err);
  }
});
/* =================================================
   SUBZONES (YOUR TABLE FIXED)
   table: subzone_id, subzone_name, zone_id
================================================= */
// ================= SUBZONES =================

// ADD
app.post("/subzones", async (req, res) => {
  try {
    const { subzone_name, zone_id } = req.body;

    await query(
      "INSERT INTO subzones(subzone_name, zone_id, is_active, created_at) VALUES(?,?,1,NOW())",
      [subzone_name, zone_id]
    );

    res.json({ message: "Subzone added" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET ALL
app.get("/subzones", async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.subzone_id,
        s.subzone_name,
        s.zone_id,
        z.zone_name,
        s.created_at,
        s.updated_at
      FROM subzones s
      JOIN zones z ON s.zone_id = z.zone_id
      WHERE s.is_active = 1
      ORDER BY s.subzone_id DESC
    `);

    res.json(result);
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE
app.put("/subzones/:id", async (req, res) => {
  try {
    const { subzone_name, zone_id } = req.body;

    await query(
      "UPDATE subzones SET subzone_name=?, zone_id=?, updated_at=NOW() WHERE subzone_id=?",
      [subzone_name, zone_id, req.params.id]
    );

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE (soft delete)
app.patch("/subzones/:id/delete", async (req, res) => {
  try {
    await query(
      "UPDATE subzones SET is_active=0 WHERE subzone_id=?",
      [req.params.id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});

/* =================================================
   COUNTS API
================================================= */
app.get("/counts/groups", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM groups WHERE is_active=1");
  res.json(r[0]);
});

app.get("/counts/chains", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM chains WHERE is_active=1");
  res.json(r[0]);
});

app.get("/counts/brands", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM brands WHERE is_active=1");
  res.json(r[0]);
});

app.get("/counts/zones", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM zones WHERE is_active=1");
  res.json(r[0]);
});

app.get("/counts/estimates", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM estimates WHERE is_active=1");
  res.json(r[0]);
});

app.get("/counts/invoices", async (req, res) => {
  const r = await query("SELECT COUNT(*) AS total FROM invoices");
  res.json(r[0]);
});

/* =================================================
   START SERVER
================================================= */
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});