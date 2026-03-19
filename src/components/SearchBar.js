import React, { Component } from 'react';

class SearchBar extends Component {
  render() {
    const {
      searchQuery,
      filterState,
      filterProtocol,
      onSearch,
      onFilterState,
      onFilterProtocol,
      totalShown,
      totalAll,
    } = this.props;

    return (
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by process, host, IP, or port..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => onSearch('')}>✕</button>
          )}
        </div>

        <div className="filter-group">
          <label className="filter-label">State</label>
          <select
            className="filter-select"
            value={filterState}
            onChange={e => onFilterState(e.target.value)}
          >
            <option value="all">All States</option>
            <option value="ESTABLISHED">Established</option>
            <option value="LISTEN">Listening</option>
            <option value="TIME_WAIT">Time Wait</option>
            <option value="CLOSE_WAIT">Close Wait</option>
            <option value="UDP">UDP</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Protocol</label>
          <select
            className="filter-select"
            value={filterProtocol}
            onChange={e => onFilterProtocol(e.target.value)}
          >
            <option value="all">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
          </select>
        </div>

        <div className="results-count">
          {totalShown === totalAll
            ? `${totalAll} connections`
            : `${totalShown} of ${totalAll} connections`}
        </div>
      </div>
    );
  }
}

export default SearchBar;
