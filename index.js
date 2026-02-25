import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT || 3000;

// Prefer Railway's DATABASE_URL; fallback to local dev defaults.
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:123456@localhost:5432/world";

const db = new pg.Pool({
  connectionString,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    const countries = result.rows.map((country) => country.country_code);

    res.render("index.ejs", { countries, total: countries.length });
  } catch (err) {
    console.error("Failed to load visited countries", err);
    res.status(500).send("Database error");
  }
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [input],
    );

    if (result.rows.length !== 0) {
      const data = result.rows[0];
      const countryCode = data.country_code;

      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode],
      );
      res.redirect("/");
    } else {
      res.status(404).send("Country not found");
    }
  } catch (err) {
    console.error("Failed to add country", err);
    res.status(500).send("Database error");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
