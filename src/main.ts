import { startApplication } from './app/controller';
import './styles.css';

const dispose = startApplication();
if (import.meta.hot) import.meta.hot.dispose(dispose);
