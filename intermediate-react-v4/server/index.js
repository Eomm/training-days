'use strict'

import fs from 'fs';

import express from 'express';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';

import App from '../src/ServerApp';

const PORT = process.env.PORT || 3000;

const html = fs.readFileSync('dist/frontend/index_ssr.html', 'utf8');
const parts = html.split('<-- ::APP:: -->');

const app = express();

app.use("/frontend", express.static("dist/frontend"));
app.use((req, res) => {
  const reactMarkup = (
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
  )

  const html = parts[0] + renderToString(reactMarkup) + parts[1];
  res.send(html);
  res.end();
});

console.log(`Listening on http://localhost:${PORT}`);
app.listen(PORT);