import groupBy from 'lodash.groupby';

export default class RowGrouperResolver {
  initRowsCollection() {
    return [];
  }

  getGroupedRows(rows, columnName) {
    return groupBy(rows, columnName);
  }

  getGroupKeys(groupedRows) {
    return Object.keys(groupedRows);
  }

  addHeaderRow(rowGroupHeader, dataviewRows) {
    return [...dataviewRows, rowGroupHeader];
  }
}
