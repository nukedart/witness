import React, { Component } from 'react';
import './static/App.css';
import StatsBar from './components/StatsBar';
import SearchBar from './components/SearchBar';
import ConnectionList from './components/ConnectionList';

const ipcRenderer = window.require('electron').ipcRenderer;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connections: [],
      filteredConnections: [],
      searchQuery: '',
      filterState: 'all',
      filterProtocol: 'all',
      sortColumn: 'command',
      sortDirection: 'asc',
      lastUpdate: null,
      isLive: true,
    };
  }

  componentDidMount() {
    ipcRenderer.on('connections-update', (event, connections) => {
      this.setState({ connections, lastUpdate: Date.now() }, () => {
        this.applyFilters();
      });
    });

    ipcRenderer.send('request-connections');
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners('connections-update');
  }

  applyFilters() {
    const { connections, searchQuery, filterState, filterProtocol, sortColumn, sortDirection } = this.state;

    let filtered = connections;

    if (filterState !== 'all') {
      filtered = filtered.filter(c => c.state === filterState);
    }

    if (filterProtocol !== 'all') {
      filtered = filtered.filter(c => c.protocol === filterProtocol);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(c =>
        (c.command && c.command.toLowerCase().includes(q)) ||
        (c.remoteHost && c.remoteHost.toLowerCase().includes(q)) ||
        (c.remoteAddress && c.remoteAddress.toLowerCase().includes(q)) ||
        (c.localAddress && c.localAddress.toLowerCase().includes(q)) ||
        (c.remotePort && c.remotePort.toString().includes(q)) ||
        (c.pid && c.pid.toString().includes(q))
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal = a[sortColumn] || '';
      let bVal = b[sortColumn] || '';
      if (typeof aVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    this.setState({ filteredConnections: filtered });
  }

  handleSearch = (query) => {
    this.setState({ searchQuery: query }, this.applyFilters);
  }

  handleFilterState = (filterState) => {
    this.setState({ filterState }, this.applyFilters);
  }

  handleFilterProtocol = (filterProtocol) => {
    this.setState({ filterProtocol }, this.applyFilters);
  }

  handleSort = (column) => {
    this.setState(prev => ({
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'asc' ? 'desc' : 'asc',
    }), this.applyFilters);
  }

  handleBlock = (connection) => {
    if (!connection.remoteAddress || !connection.remotePort) return;
    ipcRenderer.send('block-connection', {
      remoteAddress: connection.remoteAddress,
      remotePort: connection.remotePort,
      protocol: connection.protocol,
    });
  }

  render() {
    const { filteredConnections, connections, searchQuery, filterState, filterProtocol, sortColumn, sortDirection, lastUpdate } = this.state;

    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-left">
            <span className="app-logo">◉</span>
            <span className="app-title">WITNESS</span>
            <span className="app-subtitle">Network Traffic Monitor</span>
          </div>
          <div className="app-header-right">
            <span className={`live-indicator ${lastUpdate ? 'live' : 'waiting'}`}>
              <span className="live-dot" />
              {lastUpdate ? 'LIVE' : 'CONNECTING...'}
            </span>
          </div>
        </header>

        <StatsBar connections={connections} />

        <SearchBar
          searchQuery={searchQuery}
          filterState={filterState}
          filterProtocol={filterProtocol}
          onSearch={this.handleSearch}
          onFilterState={this.handleFilterState}
          onFilterProtocol={this.handleFilterProtocol}
          totalShown={filteredConnections.length}
          totalAll={connections.length}
        />

        <ConnectionList
          connections={filteredConnections}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={this.handleSort}
          onBlock={this.handleBlock}
        />
      </div>
    );
  }
}

export default App;
