import React from 'react';

const SeasonAwards: React.FC = () => {
  return (
    <div className="season-awards">
      <div className="awards-header">
        <h2>Season Awards</h2>
      </div>

      <div className="empty-state">
        <h3>Awards System</h3>
        <p>Season awards will be generated here based on player statistics.</p>
      </div>
    </div>
  );
};

export default SeasonAwards;