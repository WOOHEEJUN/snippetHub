
import React from 'react';
import { Medal } from 'iconoir-react';

export const getBadgeIcon = (badgeName) => {
  if (!badgeName) {
    return <Medal color="lightgray" width="100%" height="100%" />;
  }
  const lowerCaseBadgeName = badgeName.toLowerCase();
  let color = 'lightgray';

  if (lowerCaseBadgeName.includes('bronze')) {
    color = '#cd7f32';
  } else if (lowerCaseBadgeName.includes('silver')) {
    color = '#c0c0c0';
  } else if (lowerCaseBadgeName.includes('gold')) {
    color = '#ffd700';
  } else if (lowerCaseBadgeName.includes('platinum')) {
    color = '#e5e4e2';
  } else if (lowerCaseBadgeName.includes('diamond')) {
    color = '#b9f2ff';
  }

  return <Medal color={color} width="100%" height="100%" />;
};
