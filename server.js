const express = require("express");
const app = express();
const port = 3000;

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

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
