import React, { Component } from 'react';

const STATE_COLORS = {
  ESTABLISHED: '#3fb950',
  LISTEN: '#58a6ff',
  TIME_WAIT: '#d29922',
  CLOSE_WAIT: '#f78166',
  UDP: '#bc8cff',
};

const WELL_KNOWN_PORTS = {
  '80': 'HTTP',
  '443': 'HTTPS',
  '22': 'SSH',
  '21': 'FTP',
  '25': 'SMTP',
  '53': 'DNS',
  '3306': 'MySQL',
  '5432': 'Postgres',
  '6379': 'Redis',
  '27017': 'MongoDB',
  '8080': 'HTTP-Alt',
  '3000': 'Dev',
  '8443': 'HTTPS-Alt',
};

function getPortLabel(port) {
  return WELL_KNOWN_PORTS[port] || port;
}

function SortIcon({ column, sortColumn, sortDirection }) {
  if (sortColumn !== column) return <span className="sort-icon inactive">⇅</span>;
  return <span className="sort-icon active">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
}

class ConnectionList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedId: null,
    };
  }

  toggleExpand(id) {
    this.setState(prev => ({ expandedId: prev.expandedId === id ? null : id }));
  }

  render() {
    const { connections, sortColumn, sortDirection, onSort, onBlock } = this.props;
    const { expandedId } = this.state;

    return (
      <div className="connection-list-wrap">
        <table className="connection-table">
          <thead>
            <tr>
              <th className="col-process sortable" onClick={() => onSort('command')}>
                Process <SortIcon column="command" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-pid sortable" onClick={() => onSort('pid')}>
                PID <SortIcon column="pid" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-proto sortable" onClick={() => onSort('protocol')}>
                Proto <SortIcon column="protocol" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-local">Local</th>
              <th className="col-remote sortable" onClick={() => onSort('remoteHost')}>
                Remote Host <SortIcon column="remoteHost" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-port sortable" onClick={() => onSort('remotePort')}>
                Port <SortIcon column="remotePort" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-state sortable" onClick={() => onSort('state')}>
                State <SortIcon column="state" sortColumn={sortColumn} sortDirection={sortDirection} />
              </th>
              <th className="col-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-state">
                  <span className="empty-icon">◎</span>
                  <span>No connections found</span>
                </td>
              </tr>
            )}
            {connections.map(conn => (
              <React.Fragment key={conn.id}>
                <tr
                  className={`conn-row ${expandedId === conn.id ? 'expanded' : ''}`}
                  onClick={() => this.toggleExpand(conn.id)}
                >
                  <td className="col-process">
                    <span className="process-icon">{conn.command ? conn.command[0].toUpperCase() : '?'}</span>
                    <span className="process-name">{conn.command}</span>
                  </td>
                  <td className="col-pid mono">{conn.pid}</td>
                  <td className="col-proto">
                    <span className={`proto-badge proto-${conn.protocol}`}>{conn.protocol}</span>
                  </td>
                  <td className="col-local mono">
                    {conn.localAddress}:{conn.localPort}
                  </td>
                  <td className="col-remote">
                    <span className="remote-host">
                      {conn.remoteHost && conn.remoteHost !== conn.remoteAddress
                        ? conn.remoteHost
                        : (conn.remoteAddress || '—')}
                    </span>
                  </td>
                  <td className="col-port">
                    {conn.remotePort ? (
                      <span className="port-badge" title={conn.remotePort}>
                        {getPortLabel(conn.remotePort)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="col-state">
                    <span
                      className="state-badge"
                      style={{ color: STATE_COLORS[conn.state] || '#8b949e' }}
                    >
                      {conn.state}
                    </span>
                  </td>
                  <td className="col-action" onClick={e => e.stopPropagation()}>
                    {conn.remoteAddress && conn.state === 'ESTABLISHED' && (
                      <button
                        className="btn-block"
                        title={`Block ${conn.remoteAddress}:${conn.remotePort}`}
                        onClick={() => onBlock(conn)}
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === conn.id && (
                  <tr className="conn-detail-row">
                    <td colSpan="8">
                      <div className="conn-detail">
                        <div className="conn-detail-grid">
                          <DetailItem label="Process" value={conn.command} />
                          <DetailItem label="PID" value={conn.pid} />
                          <DetailItem label="User" value={conn.user} />
                          <DetailItem label="Protocol" value={conn.protocol} />
                          <DetailItem label="Address Family" value={conn.fdType} />
                          <DetailItem label="State" value={conn.state} />
                          <DetailItem label="Local Address" value={`${conn.localAddress}:${conn.localPort}`} />
                          <DetailItem label="Remote Address" value={conn.remoteAddress ? `${conn.remoteAddress}:${conn.remotePort}` : '—'} />
                          <DetailItem label="Remote Host" value={conn.remoteHost || '—'} />
                          <DetailItem label="Remote Port" value={`${conn.remotePort} ${WELL_KNOWN_PORTS[conn.remotePort] ? `(${WELL_KNOWN_PORTS[conn.remotePort]})` : ''}`} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value mono">{value}</span>
    </div>
  );
}

export default ConnectionList;
