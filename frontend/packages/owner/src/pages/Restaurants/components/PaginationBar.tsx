import styles from './PaginationBar.module.css';

interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({ page, totalPages, totalCount, pageSize, onPageChange }: PaginationBarProps) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className={styles.wrapper}>
      <span className={styles.info}>{from}–{to} из {totalCount}</span>
      <div className={styles.btns}>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`${styles.btn} ${page === 1 ? styles.btnDisabled : ''}`}
        >
          ← Назад
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={`${styles.btn} ${page >= totalPages ? styles.btnDisabled : ''}`}
        >
          Вперёд →
        </button>
      </div>
    </div>
  );
}
