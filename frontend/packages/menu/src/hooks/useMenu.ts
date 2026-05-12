import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMenu } from '../api/menu';
import type { MenuPageResponse } from '@qrmenu/ui';

export const useMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const initialLang =
    searchParams.get('lang') || localStorage.getItem('menu_lang') || 'ru';

  const [lang, setLang] = useState<string>(initialLang);
  const table = searchParams.get('table');
  const menuId = searchParams.get('menu_id') ?? undefined;

  const query = useQuery<MenuPageResponse, Error>({
    queryKey: ['menu', slug, lang, menuId],
    queryFn: () => getMenu(slug!, lang, menuId),
    staleTime: 5 * 60 * 1000,
    enabled: !!slug,
    retry: (count, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 403) return false;
      return count < 1;
    },
  });

  return { ...query, slug: slug!, lang, setLang, table };
};
