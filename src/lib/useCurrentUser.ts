'use client';

import { useEffect, useState } from 'react';

interface CurrentUser {
  nama?: string;
  username?: string;
  role?: 'Bumdes' | 'Umum';
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const isViewer = user?.role === 'Umum';

  return { user, isLoading, isViewer };
}