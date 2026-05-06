import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ConfirmModal, useToast, Skeleton, PLAN, PLAN_STATUS } from '@qrmenu/ui';
import { getRestaurants, updateRestaurant, type OwnerRestaurant } from '../../api/owner';
import RestaurantsFilters from './components/RestaurantsFilters';
import RestaurantRow from './components/RestaurantRow';
import PaginationBar from './components/PaginationBar';

const LIMIT = 20;

const COLUMNS = ['Название', 'План', 'Статус', 'Создан', 'Триал до', 'Действия'];
const WIDTHS   = ['',        '110px', '80px', '100px', '100px',  '140px'];

function getFilterParams(filter: string) {
  if ([PLAN.STARTER, PLAN.BUSINESS, PLAN.PRO].includes(filter as never)) return { plan: filter };
  if ([PLAN_STATUS.TRIAL, PLAN_STATUS.EXPIRED].includes(filter as never)) return { status: filter };
  return {};
}

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<OwnerRestaurant | null>(null);
  const qc = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['restaurants', search, activeFilter, page],
    queryFn: () => getRestaurants({ search, ...getFilterParams(activeFilter), page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_active?: boolean; plan?: string } }) =>
      updateRestaurant(id, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurants'] }); showToast('Изменения сохранены', 'success'); },
    onError: () => showToast('Ошибка при сохранении', 'error'),
  });

  const handleSearchChange = useCallback((val: string) => { setSearch(val); setPage(1); }, []);
  const handleFilterChange = useCallback((filter: string) => { setActiveFilter(filter); setPage(1); }, []);
  const handlePlanChange = useCallback((id: string, plan: string) => { updateMut.mutate({ id, patch: { plan } }); }, [updateMut]);
  const handleToggleActive = useCallback((r: OwnerRestaurant) => {
    if (r.is_active) setConfirmTarget(r);
    else updateMut.mutate({ id: r.id, patch: { is_active: true } });
  }, [updateMut]);
  const handleConfirmDeactivate = useCallback(() => {
    if (confirmTarget) updateMut.mutate({ id: confirmTarget.id, patch: { is_active: false } });
    setConfirmTarget(null);
  }, [confirmTarget, updateMut]);

  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <RestaurantsFilters
        search={search}
        onSearchChange={handleSearchChange}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        totalCount={total}
      />

      <div style={{ background: 'var(--cream-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', padding: 20 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height="40px" />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cream-border)' }}>
                  {COLUMNS.map((col, i) => (
                    <th key={col} style={{ width: WIDTHS[i] || undefined, padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-secondary)', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map(r => (
                  <RestaurantRow
                    key={r.id}
                    restaurant={r}
                    onPlanChange={handlePlanChange}
                    onToggleActive={handleToggleActive}
                    isPending={updateMut.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar page={page} totalPages={pages} totalCount={total} pageSize={LIMIT} onPageChange={setPage} />
      </div>

      <ConfirmModal
        isOpen={!!confirmTarget}
        title="Деактивировать ресторан?"
        message={`Ресторан «${confirmTarget?.name}» будет деактивирован. Меню станет недоступным для гостей.`}
        confirmText="Деактивировать"
        cancelText="Отмена"
        danger
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
