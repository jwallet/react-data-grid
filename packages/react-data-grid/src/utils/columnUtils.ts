import {
  Column,
  CalculatedColumn,
  ColumnMetrics,
  CellContentRenderer
} from '../common/types';
import { getScrollbarSize } from './domUtils';
import { SelectColumn } from '../Columns';

interface Metrics<R> {
  columns: Column<R>[];
  columnWidths: Map<keyof R, number>;
  minColumnWidth: number;
  viewportWidth: number;
  defaultCellContentRenderer: CellContentRenderer<R>;
}

const comparer = (a: number, b: number) => {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
};

interface ColumnWidth {
  idx: number;
  minWidth: number;
  width?: number;
}

const sortColumnMinWidths = (columnWidths: ColumnWidth[]) => {
  const rowComparer = (a: ColumnWidth, b: ColumnWidth) => {
    return -1 * comparer(a.minWidth, b.minWidth);
  };
  return columnWidths.slice().sort(rowComparer);
};

const setMinWidth = (minColumnWidths: ColumnWidth[], columnWidth: ColumnWidth, unallocatedColumnWidth: number) => {
  const index = minColumnWidths.findIndex(({ idx }) => idx === columnWidth.idx);
  if (typeof index === 'number') {
    minColumnWidths[index].minWidth = Math.floor(unallocatedColumnWidth);
  }
  return minColumnWidths;
};

export function getColumnMetrics<R>(metrics: Metrics<R>): ColumnMetrics<R> {
  let left = 0;
  let totalWidth = 0;
  const minWidths: ColumnWidth[] = [];
  let lastFrozenColumnIndex = -1;
  const columns: Array<Column<R> & { width: number | void }> = [];

  metrics.columns.forEach((metricsColumn: Column<R>, idx: number) => {
    const width = getSpecifiedWidth(
      metricsColumn,
      metrics.columnWidths,
      metrics.viewportWidth
    );
    const column = { ...metricsColumn, width };

    console.log(idx, column.key, width);

    minWidths.push({
      idx,
      minWidth: width || 0,
      width: typeof metricsColumn.width === 'string' ? Number(metricsColumn.width) : metricsColumn.width
    });

    if (isFrozen(column)) {
      lastFrozenColumnIndex++;
      columns.splice(lastFrozenColumnIndex, 0, column);
    } else {
      columns.push(column);
    }
  });

  const isFixedWidth = (w: ColumnWidth) => w.width && w.width === w.minWidth;
  const unallocatedWidth = metrics.viewportWidth - minWidths.reduce((acc, w) => isFixedWidth(w) ? acc + w.width! : acc, 0) - getScrollbarSize();
  const columnsUnallocatedCount = columns.length - minWidths.reduce((acc, w) => isFixedWidth(w) ? acc + 1 : acc, 0);
  let unallocatedColumnWidth = unallocatedWidth / columnsUnallocatedCount;

  sortColumnMinWidths(minWidths).forEach((w, i) => {
    if (isFixedWidth(w)) return;
    if (w.minWidth > unallocatedColumnWidth) {
      unallocatedColumnWidth -= (w.minWidth % unallocatedColumnWidth) / (columnsUnallocatedCount - (i + 1));
    } else {
      setMinWidth(minWidths, w, unallocatedColumnWidth);
    }
  });

  const calculatedColumns: CalculatedColumn<R>[] = columns.map(
    (column, idx) => {
      const minWidth = (minWidths.find(w => w.idx === idx) || {}).minWidth || 0;
      const allocatedWidth = column.width === undefined ? metrics.minColumnWidth : column.width;
      const width = Math.max(minWidth, Math.min(metrics.minColumnWidth, allocatedWidth));
      console.log(idx, width, column.key);
      const newColumn = {
        ...column,
        idx,
        width,
        left,
        cellContentRenderer:
          column.cellContentRenderer || metrics.defaultCellContentRenderer
      };
      totalWidth += width;
      left += width;
      return newColumn;
    }
  );

  return {
    columns: calculatedColumns,
    lastFrozenColumnIndex,
    totalColumnWidth: totalWidth,
    viewportWidth: metrics.viewportWidth
  };
}

// get column width, fallback on defaultWidth when width is undefined
function getWidth(
  viewportWidth: number,
  width?: number | string,
  defaultWidth?: number
): number | void {
  switch (typeof width) {
    case 'string':
      return /^\d+%$/.test(width)
        ? Math.floor((viewportWidth * parseInt(width, 10)) / 100)
        : defaultWidth;
    case 'number':
      return width;
    default:
      return defaultWidth;
  }
}

function getSpecifiedWidth<R>(
  column: Column<R>,
  columnWidths: Map<keyof R, number>,
  viewportWidth: number
): number | void {
  // get column min width from grid or column prop, fallback on defaultMinColumnWidth if undefined
  const width = getWidth(viewportWidth, column.width);

  // SelectColumn must always use width prop when defined
  if (column.key === SelectColumn.key) {
    return width;
  }

  if (columnWidths.has(column.key)) {
    // Use the resized width if available
    return columnWidths.get(column.key);
  }

  if (width !== undefined) {
    return width;
  }

  return column.minWidth;
}

// Logic extented to allow for functions to be passed down in column.editable
// this allows us to deicde whether we can be editing from a cell level
export function canEdit<R>(
  column: CalculatedColumn<R>,
  rowData: R,
  enableCellSelect?: boolean
): boolean {
  if (typeof column.editable === 'function') {
    return enableCellSelect === true && column.editable(rowData);
  }
  return enableCellSelect === true && (!!column.editor || !!column.editable);
}

export function isFrozen<R>(column: Column<R> | CalculatedColumn<R>): boolean {
  return column.frozen === true;
}

export function getColumnScrollPosition<R>(
  columns: CalculatedColumn<R>[],
  idx: number,
  currentScrollLeft: number,
  currentClientWidth: number
): number {
  let left = 0;
  let frozen = 0;

  for (let i = 0; i < idx; i++) {
    const column = columns[i];
    if (column) {
      if (column.width) {
        left += column.width;
      }
      if (isFrozen(column)) {
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
