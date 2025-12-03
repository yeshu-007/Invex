import React from 'react';
import * as Icons from 'lucide-react';

/**
 * Simple Icon component - just use <Icon name="wrench" />
 * 
 * Usage examples:
 * <Icon name="wrench" />
 * <Icon name="laptop" size={24} color="#667eea" />
 * <Icon name="search" className="search-icon" />
 */
const Icon = ({ name, size = 20, color, className, ...props }) => {
  // Convert name to PascalCase (e.g., "wrench" -> "Wrench", "arrow-right" -> "ArrowRight")
  const iconName = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Get the icon component from lucide-react
  const IconComponent = Icons[iconName];

  // If icon doesn't exist, show a warning and return null
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide Icons`);
    return null;
  }

  return <IconComponent size={size} color={color} className={className} {...props} />;
};

export default Icon;

