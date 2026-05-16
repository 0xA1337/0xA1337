import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import chokidar from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const README_PATH = join(__dirname, 'README.md');
const TEMPLATE_PATH = join(__dirname, 'template.html');
const DIST_DIR = join(__dirname, 'dist');
const OUTPUT_PATH = join(DIST_DIR, 'index.html');

function build() {
  const readme = readFileSync(README_PATH, 'utf-8');
  const template = readFileSync(TEMPLATE_PATH, 'utf-8');
  const content = md.render(readme);
  const html = template.replace('{{content}}', content);

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, html);
  console.log(`[${new Date().toLocaleTimeString()}] Built dist/index.html`);
}

function serve(port = 3000) {
  const server = createServer((req, res) => {
    try {
      const html = readFileSync(OUTPUT_PATH, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end('Error: Run build first or check README.md exists');
    }
  });

  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Watching README.md for changes... (manual refresh required)');
  });
}

function watch() {
  build();
  serve();

  chokidar.watch([README_PATH, TEMPLATE_PATH]).on('change', (path) => {
    console.log(`File changed: ${path}`);
    build();
  });
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--watch')) {
  watch();
} else {
  build();
}
