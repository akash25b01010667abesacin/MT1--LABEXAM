import express from 'express';

const PORT = 4000;
const app = express();

app.use(express.json());

const books = [
  { id: 1, title: 'The Alchemist', author: 'Paulo Coelho', price: 350, category: 'Fiction' },
  { id: 2, title: '1984', author: 'George Orwell', price: 400, category: 'Dystopian' },
  { id: 3, title: 'Atomic Habits', author: 'James Clear', price: 500, category: 'Self-help' }
];

const requiredFields = ['id', 'title', 'author', 'price', 'category'];

function hasRequiredFields(book) {
  return requiredFields.every((field) => (
    book
    && book[field] !== undefined
    && book[field] !== null
    && book[field] !== ''
  ));
}

function getBookId(request) {
  const id = Number(request.params.id);
  return Number.isInteger(id) ? id : null;
}

app.get('/books', (request, response) => {
  response.json(books);
});

app.get('/books/:id', (request, response) => {
  const id = getBookId(request);
  const book = books.find((item) => item.id === id);

  if (!book) {
    response.status(404).json({ error: 'Book not found' });
    return;
  }

  response.json(book);
});

app.post('/books', (request, response) => {
  if (!hasRequiredFields(request.body)) {
    response.status(400).json({
      error: 'Required fields are id, title, author, price and category'
    });
    return;
  }

  if (books.some((book) => book.id === request.body.id)) {
    response.status(409).json({ error: 'A book with this id already exists' });
    return;
  }

  books.push(request.body);
  response.status(201).json({ message: 'Book added successfully', book: request.body });
});

app.put('/books/:id', (request, response) => {
  const id = getBookId(request);
  const bookIndex = books.findIndex((item) => item.id === id);

  if (bookIndex === -1) {
    response.status(404).json({ error: 'Book not found' });
    return;
  }

  const updatedBook = { ...request.body, id };
  if (!hasRequiredFields(updatedBook)) {
    response.status(400).json({
      error: 'Required fields are id, title, author, price and category'
    });
    return;
  }

  books[bookIndex] = updatedBook;
  response.json({ message: 'Book updated successfully', book: updatedBook });
});

app.delete('/books/:id', (request, response) => {
  const id = getBookId(request);
  const bookIndex = books.findIndex((item) => item.id === id);

  if (bookIndex === -1) {
    response.status(404).json({ error: 'Book not found' });
    return;
  }

  const [deletedBook] = books.splice(bookIndex, 1);
  response.json({ message: 'Book deleted successfully', book: deletedBook });
});

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Invalid JSON request body' });
    return;
  }
  next(error);
});

app.use((request, response) => {
  response.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Express Server running at http://localhost:${PORT}`);
});
