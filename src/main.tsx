/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe: index.html always defines <div id="root"></div> before loading main.tsx
createRoot(document.getElementById('root')!).render(<App />);

