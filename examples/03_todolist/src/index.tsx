import { render } from 'jotai-jsx';

import App from './components/App';

const ele = document.getElementById('app');
if (!ele) throw new Error('no app');
render(<App />, ele);
