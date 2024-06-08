import { observer } from 'mobx-react';
import { CollaborativeDoc } from './pages/CollaborativeDoc';
import './theme/app.css';

function AppComponent() {
	return (
		<div className="app">
			<CollaborativeDoc />
		</div>
	);
}

export const App = observer(AppComponent);
