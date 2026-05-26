import { useState } from 'react';
import { LOGIN_TAGLINE } from '../data/lore.js';

export default function LoginScreen({ onLogin, hadPreviousSave }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = username.trim();
    if (name.length < 2) {
      setError('Identifiant opérateur requis (2 caractères minimum).');
      return;
    }
    if (password.length < 1) {
      setError('Mot de passe requis (fictif — aucune donnée réelle).');
      return;
    }
    onLogin(name);
  };

  return (
    <div className="login-screen">
      <div className="login-panel">
        <div className="login-logo">ULTRATECH OS</div>
        <p className="login-tagline">{LOGIN_TAGLINE}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Identifiant opérateur
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              placeholder="runner-007"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="off"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg">
            Connexion
          </button>
        </form>

        <p className="login-disclaimer">
          Interface fictive — aucune authentification réelle. Données stockées localement uniquement.
        </p>
        {hadPreviousSave && (
          <p className="login-save-hint">Sauvegarde locale détectée — nouvelle session opérateur.</p>
        )}
      </div>
    </div>
  );
}
