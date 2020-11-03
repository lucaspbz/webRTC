import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (request, response) => {
  response.json({ message: 'Hello world' });
});

const port = 3333;

app.listen(port, () => {
  console.log(`Server listening to port ${port}`);
});
