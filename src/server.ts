import { createApp } from './app.js';
import { migrate } from './db/database.js';

const PORT = Number(process.env.PORT ?? 3000);

migrate();

const app = createApp();
app.listen(PORT, () => {
  console.log(`Tax dashboard running at http://localhost:${PORT}`);
});
