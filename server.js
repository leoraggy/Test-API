const express = require("express");
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Personalized greeting endpoint
app.get("/api/hello/:name", (req, res) => {
  const name = req.params.name;
  res.json({ message: `Hello, ${name}!` });
});

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Endpoint to handle form submission
app.post("/api/submit", (req, res) => {
  const name = req.body.name;
  res.json({ message: `Form submitted successfully! Hello, ${name}!` });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
