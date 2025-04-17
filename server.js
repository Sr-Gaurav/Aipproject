const express = require('express');
const axios = require('axios');
const sql = require('mssql');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

const GEMINI_API_KEY = 'AIzaSyC6gGplIhh8WWipu6vgKvTdaC9T4roFTyw';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';


const sqlConfig = {
  user: 'gaurav', 
  password: 'Rebel@13',
  server: 'gauravserver.database.windows.net',
  database: 'gaurav',
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const createTableIfNotExists = async () => {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME = 'ChatHistory'
      )
      BEGIN
        CREATE TABLE ChatHistory (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userMessage NVARCHAR(MAX),
          botResponse NVARCHAR(MAX),
          timestamp DATETIME DEFAULT GETDATE()
        )
      END
    `);
    console.log("ChatHistory table ensured.");
  } catch (err) {
    console.error("Error creating table:", err);
  }
};


app.post('/chat', async (req, res) => {
  const userMsg = req.body.message;

  try {
    const geminiResponse = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: userMsg }] }]
      }
    );

    const botReply = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";

    await sql.connect(sqlConfig);
    await sql.query`
      INSERT INTO ChatHistory (userMessage, botResponse)
      VALUES (${userMsg}, ${botReply})
    `;

    res.json({ reply: botReply });
  } catch (err) {
    console.error('Gemini API or SQL Error:', err);
    res.json({ reply: 'Error processing your request.' });
  }
});

app.get('/history', async (req, res) => {
  try {
    await sql.connect(sqlConfig);
    const result = await sql.query(`
      SELECT TOP 10 * FROM ChatHistory ORDER BY timestamp DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(' Fetch history error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/delete-history', async (req, res) => {
    try {
      await sql.connect(sqlConfig);
      await sql.query('DELETE FROM ChatHistory');
      res.json({ message: 'Chat history deleted successfully' });
    } catch (err) {
      console.error('Error deleting chat history:', err);
      res.status(500).json({ error: 'Failed to delete chat history' });
    }
  });

app.listen(port, async () => {
  await createTableIfNotExists();
  console.log(` Server running at http://localhost:${port}`);
  

});
