import React, { Component } from 'react';

class StatsBar extends Component {
  render() {
    const { connections } = this.props;

    const established = connections.filter(c => c.state === 'ESTABLISHED').length;
    const listening = connections.filter(c => c.state === 'LISTEN').length;
    const tcpCount = connections.filter(c => c.protocol === 'TCP').length;
    const udpCount = connections.filter(c => c.protocol === 'UDP').length;
    const processes = new Set(connections.map(c => c.command)).size;
    const uniqueRemotes = new Set(
      connections.filter(c => c.remoteAddress && c.remoteAddress !== '*').map(c => c.remoteAddress)
    ).size;

    return (
      <div className="stats-bar">
        <StatCard label="Total" value={connections.length} color="#58a6ff" />
        <StatCard label="Established" value={established} color="#3fb950" />
        <StatCard label="Listening" value={listening} color="#d29922" />
        <StatCard label="TCP" value={tcpCount} color="#bc8cff" />
        <StatCard label="UDP" value={udpCount} color="#f78166" />
        <StatCard label="Processes" value={processes} color="#58a6ff" />
        <StatCard label="Remote Hosts" value={uniqueRemotes} color="#3fb950" />
      </div>
    );
  }
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default StatsBar;
