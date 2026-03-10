import { useSearch } from '@tanstack/react-router';
import { LoginPage } from './LoginPage';

export default function LoginRoutePage() {
  const search = useSearch({ from: '/login' });

  return <LoginPage redirectTo={search.redirect} />;
}
