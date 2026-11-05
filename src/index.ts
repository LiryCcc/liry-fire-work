import { AppRoot } from './app-root.js';
import './index.css';

const main = (): void => {
  document.body.append(new AppRoot());
};

main();
