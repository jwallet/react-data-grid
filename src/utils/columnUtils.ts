import { Column, CalculatedColumn, ColumnMetrics, FormatterProps, Omit } from '../common/types';
import { getScrollbarSize } from './domUtils';

interface Metrics<R> {
  columns: readonly Column<R>[];
  columnWidths: ReadonlyMap<string, number>;
  minColumnWidth: number;
  viewportWidth: number;
  defaultFormatter: React.ComponentType<FormatterProps<R>>;
}

const comparer = (a: number, b: number) => {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
};

interface ColumnWidth {
  idx: number;
  width: number;
  allocated: boolean;
}


const sortColumnWidths = (columnWidths: ColumnWidth[]) => {
  const rowComparer = (a: ColumnWidth, b: ColumnWidth) => {
    return -1 * comparer(a.width, b.width);
  };
  return columnWidths.slice().sort(rowComparer);
};

export function getColumnMetrics<R>(metrics: Metrics<R>): ColumnMetrics<R> {
  let left = 0;
  let totalWidth = 0;
  const widths: ColumnWidth[] = [];
  let lastFrozenColumnIndex = -1;
  const columns: Array<Omit<Column<R>, 'width'> & { width: number | void }> = [];

  metrics.columns.forEach((metricsColumn: Column<R>, idx: number) => {
    const width = getSpecifiedWidth(metricsColumn, metrics.columnWidths, metrics.viewportWidth, metrics.minColumnWidth);
    const column = { ...metricsColumn, width };

    widths.push({ idx, width: width || 0, allocated: false });

    if (column.frozen) {
      lastFrozenColumnIndex++;
      columns.splice(lastFrozenColumnIndex, 0, column);
    } else {
      columns.push(column);
    }
  });

  const unallocatedWidth = metrics.viewportWidth - widths.reduce((acc, { width }) => acc + width, 0) - getScrollbarSize();
  let unallocatedColumnWidth = unallocatedWidth / columns.length;
  sortColumnWidths(widths).forEach((w, i) => {
    if (w.width > unallocatedColumnWidth) {
      unallocatedColumnWidth -= (widths[i].width % unallocatedColumnWidth) / (columns.length - (i + 1));
    } else {
      const index = widths.findIndex(w => w.idx === i);
      widths[index].width = unallocatedColumnWidth;
    }
  });

  const calculatedColumns: CalculatedColumn<R>[] = columns.map((column, idx) => {
    const { width = 0 } = widths.find(w => w.idx === idx) || {};
    const newColumn = {
      ...column,
      idx,
      width,
      left,
      formatter: column.formatter || metrics.defaultFormatter
    };
    totalWidth += width;
    left += width;
    return newColumn;
  });

  return {
    columns: calculatedColumns,
    lastFrozenColumnIndex,
    totalColumnWidth: totalWidth,
    viewportWidth: metrics.viewportWidth
  };
}

function getSpecifiedWidth<R>(
  column: Column<R>,
  columnWidths: ReadonlyMap<string, number>,
  viewportWidth: number,
  minColumnWidth: number
): number | void {
  if (columnWidths.has(column.key)) {
    // Use the resized width if available
    return columnWidths.get(column.key);
  }
  if (typeof column.width === 'number') {
    return column.width;
  }
  if (typeof column.width === 'string' && /^\d+%$/.test(column.width)) {
    return Math.max(Math.floor(viewportWidth * parseInt(column.width, 10) / 100), minColumnWidth);
  }
}

// Logic extented to allow for functions to be passed down in column.editable
// this allows us to decide whether we can be editing from a cell level
export function canEdit<R>(column: CalculatedColumn<R>, row: R): boolean {
  if (typeof column.editable === 'function') {
    return column.editable(row);
  }
  return Boolean(column.editor || column.editable);
}

export function getColumnScrollPosition<R>(columns: readonly CalculatedColumn<R>[], idx: number, currentScrollLeft: number, currentClientWidth: number): number {
  let left = 0;
  let frozen = 0;

  for (let i = 0; i < idx; i++) {
    const column = columns[i];
    if (column) {
      if (column.width) {
        left += column.width;
      }
      if (column.frozen) {
        frozen += column.width;
      }
    }
  }

  const selectedColumn = columns[idx];
  if (selectedColumn) {
    const scrollLeft = left - frozen - currentScrollLeft;
    const scrollRight = left + selectedColumn.width - currentScrollLeft;

    if (scrollLeft < 0) {
      return scrollLeft;
    }
    if (scrollRight > currentClientWidth) {
      return scrollRight - currentClientWidth;
    }
  }

  return 0;
}
