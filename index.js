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

    res.render("index.ejs", {
      countries,
      total: countries.length,
      error: req.query.error || null,
      success: req.query.success || null,
    });
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

      // Check if already visited
      const existing = await db.query(
        "SELECT 1 FROM visited_countries WHERE country_code = $1",
        [countryCode],
      );
      if (existing.rows.length > 0) {
        return res.redirect(
          "/?error=" +
            encodeURIComponent('"' + input + '" has already been added.'),
        );
      }

      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode],
      );
      res.redirect(
        "/?success=" +
          encodeURIComponent('"' + input + '" added successfully!'),
      );
    } else {
      res.redirect(
        "/?error=" +
          encodeURIComponent(
            'Country "' + input + '" was not found. Please check the spelling.',
          ),
      );
    }
  } catch (err) {
    console.error("Failed to add country", err);
    res.redirect(
      "/?error=" + encodeURIComponent("Database error. Please try again."),
    );
  }
});

app.post("/remove", async (req, res) => {
  const input = req.body["country"];

  try {
    // Look up the country code
    const lookup = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [input],
    );

    if (lookup.rows.length === 0) {
      return res.redirect(
        "/?error=" +
          encodeURIComponent(
            'Country "' + input + '" was not found. Please check the spelling.',
          ),
      );
    }

    const countryCode = lookup.rows[0].country_code;

    const result = await db.query(
      "DELETE FROM visited_countries WHERE country_code = $1 RETURNING country_code",
      [countryCode],
    );
    if (result.rows.length === 0) {
      return res.redirect(
        "/?error=" +
          encodeURIComponent('"' + input + '" is not in your visited list.'),
      );
    }
    res.redirect(
      "/?success=" + encodeURIComponent('"' + input + '" has been removed.'),
    );
  } catch (err) {
    console.error("Failed to remove country", err);
    res.redirect(
      "/?error=" + encodeURIComponent("Database error. Please try again."),
    );
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
