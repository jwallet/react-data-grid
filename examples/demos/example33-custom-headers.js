import React from "react";
import DataGrid from "@vooban/react-data-grid";
import Wrapper from "./Wrapper";

const Header = ({ title, onTitleChange }) => (
  <button onClick={onTitleChange}>{title || "DEFAULT"}</button>
);

export default class extends React.Component {
  constructor(props, context) {
    super(props, context);
    const originalRows = this.createRows(1000);
    const rows = originalRows.slice(0);
    this.state = { originalRows, rows, headers: {} };

    this._columns = [
      {
        key: "id",
        name: "ID",
        frozen: true,
        headerRenderer: (
          <Header
            title={this.state.headers.id}
            onTitleChange={() => this.handleHeaderChange("id", "ID")}
          />
        )
      },
      {
        key: "task",
        name: "Title",
        headerRenderer: (
          <Header
            title={this.state.headers.task}
            onTitleChange={() => this.handleHeaderChange("task", "Title")}
          />
        )
      },
      {
        key: "priority",
        name: "Priority",
        headerRenderer: (
          <Header
            title={this.state.headers.priority}
            onTitleChange={() =>
              this.handleHeaderChange("priority", "Priority")
            }
          />
        )
      }
    ];
  }

  handleHeaderChange = (key, name) =>
    this.setState(state => ({
      headers: {
        ...state.headers,
        [key]: state.headers[key] ? undefined : name
      }
    }));

  createRows = () => {
    const rows = [];
    for (let i = 1; i < 1000; i++) {
      rows.push({
        id: i,
        task: `Task ${i}`,
        priority: ["Critical", "High", "Medium", "Low"][
          Math.floor(Math.random() * 3 + 1)
        ]
      });
    }

    return rows;
  };

  rowGetter = i => {
    return this.state.rows[i];
  };

  render() {
    return (
      <Wrapper title="Custom Headers Example">
        <DataGrid
          columns={this._columns}
          rowGetter={this.rowGetter}
          rowsCount={this.state.rows.length}
          sortDirection={this.state.sortDirection}
          sortColumn={this.state.sortColumn}
          minHeight={500}
        />
      </Wrapper>
    );
  }
}
