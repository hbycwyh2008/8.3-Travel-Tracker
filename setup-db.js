import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Please set DATABASE_URL environment variable");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected to database");

await client.query(`
  CREATE TABLE IF NOT EXISTS countries (
    country_code CHAR(2) PRIMARY KEY,
    country_name TEXT NOT NULL
  );
`);
console.log("Created countries table");

await client.query(`
  CREATE TABLE IF NOT EXISTS visited_countries (
    id SERIAL PRIMARY KEY,
    country_code CHAR(2) REFERENCES countries(country_code)
  );
`);
console.log("Created visited_countries table");

await client.query(`
  INSERT INTO countries (country_code, country_name) VALUES
  ('US','United States'),('CA','Canada'),('MX','Mexico'),('BR','Brazil'),
  ('AR','Argentina'),('GB','United Kingdom'),('FR','France'),('DE','Germany'),
  ('IT','Italy'),('ES','Spain'),('PT','Portugal'),('NL','Netherlands'),
  ('BE','Belgium'),('CH','Switzerland'),('SE','Sweden'),('NO','Norway'),
  ('DK','Denmark'),('FI','Finland'),('IE','Ireland'),('PL','Poland'),
  ('CZ','Czech Republic'),('AT','Austria'),('GR','Greece'),('TR','Turkey'),
  ('RU','Russia'),('CN','China'),('JP','Japan'),('KR','South Korea'),
  ('IN','India'),('SG','Singapore'),('AU','Australia'),('NZ','New Zealand'),
  ('ZA','South Africa'),('EG','Egypt'),('SA','Saudi Arabia'),
  ('AE','United Arab Emirates'),('TH','Thailand'),('VN','Vietnam'),
  ('ID','Indonesia'),('MY','Malaysia'),('PH','Philippines'),('CL','Chile'),
  ('CO','Colombia'),('PE','Peru'),('UY','Uruguay'),('IL','Israel'),
  ('JO','Jordan'),('MA','Morocco'),('KE','Kenya'),('NG','Nigeria')
  ON CONFLICT (country_code) DO NOTHING;
`);
console.log("Seeded countries table");

await client.end();
console.log("Done! Database is ready.");
