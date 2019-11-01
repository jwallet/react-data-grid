import React, { useState } from 'react';
import ReactDataGrid from 'react-data-grid';

import exampleWrapper from '../components/exampleWrapper';

const CustomHeader = ({ column, outsideValue, setOutsideValue }) => {
  const [count, setCount] = useState(0);
  const [insideValue, setInsideValue] = useState(outsideValue);
  const handleClick = () => {
    const newCount = count + 1;
    const newChar = ['↕', '↓', '↑'][newCount % 3];
    setOutsideValue(newChar); // fake prop being updated
    setInsideValue(newChar); // keep track of the updated prop
    setCount(newCount);
  };
  return (
    <button type="button" onClick={handleClick}>{column.name} {outsideValue} {insideValue} ({count} clicks)</button>
  );
};

const getColumns = props => {
  return props.columns.map(x => {
    const headerProps = {
      outsideValue: props.valueToPass,
      setOutsideValue: props.setValueToPass
    };
    return { ...x, sortable: true, headerRenderer: React.createElement(CustomHeader, headerProps) };
  });
};

const ColumnHeaderRenderer = props => {
  const [valueToPass, setValueToPass] = useState('↕');
  const [columns] = useState(getColumns({ ...props, valueToPass, setValueToPass }));

  return (
    <ReactDataGrid
      columns={columns}
      rowGetter={i => rows[i]}
      rowsCount={3}
      minHeight={150}
    />
  );
};

const defaultColumns = [
  { key: 'id', name: 'ID' },
  { key: 'title', name: 'Title' },
  { key: 'count', name: 'Count' }
];

const rows = [{ id: 0, title: 'row1', count: 20 }, { id: 1, title: 'row1', count: 40 }, { id: 2, title: 'row1', count: 60 }];


export default exampleWrapper({
  WrappedComponent: () => <ColumnHeaderRenderer columns={defaultColumns} rows={rows} />,
  exampleName: 'Column Custom Header Renderer',
  exampleDescription: 'Display a header renderer with props',
  examplePath: './scripts/example32-column-header-renderer.js',
  examplePlaygroundLink: 'https://jsfiddle.net/f6mbnb8z/1/'
});
