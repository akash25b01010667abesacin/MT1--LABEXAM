import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homePagePath = path.join(__dirname, 'public', 'index.html');

const books = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', price: 350 },
  { id: 2, title: '1984', author: 'George Orwell', price: 400 },
  { id: 3, title: 'Atomic Habits', author: 'James Clear', price: 500 }
];

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function sendText(response, statusCode, content, contentType = 'text/html') {
  response.writeHead(statusCode, { 'Content-Type': `${contentType}; charset=utf-8` });
  response.end(content);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function validateBook(book) {
  const requiredFields = ['id', 'title', 'author', 'price'];
  return requiredFields.every((field) => (
    book
    && book[field] !== undefined
    && book[field] !== null
    && book[field] !== ''
  ));
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && requestUrl.pathname === '/') {
    sendText(response, 200, '<h1>Welcome to the Library Book Management System</h1>');
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/books') {
    sendJson(response, 200, books);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/about') {
    sendText(response, 200, '<h1>About</h1><p>This application manages library books using Node.js.</p>');
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/home') {
    fs.readFile(homePagePath, 'utf8', (error, fileContent) => {
      if (error) {
        sendJson(response, 500, { error: 'Unable to load the home page' });
        return;
      }
      sendText(response, 200, fileContent);
    });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/add-book') {
    try {
      const body = await readRequestBody(request);
      const newBook = JSON.parse(body);

      if (!validateBook(newBook)) {
        sendJson(response, 400, {
          error: 'Required fields are id, title, author and price'
        });
        return;
      }

      if (books.some((book) => book.id === newBook.id)) {
        sendJson(response, 409, { error: 'A book with this id already exists' });
        return;
      }

      books.push(newBook);
      sendJson(response, 201, { message: 'Book added successfully', book: newBook });
    } catch (error) {
      sendJson(response, 400, { error: error.message === 'Request body is too large' ? error.message : 'Invalid JSON request body' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});
