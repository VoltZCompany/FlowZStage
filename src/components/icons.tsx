import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName =
  | 'urgent' | 'high' | 'medium' | 'low'
  | 'work' | 'personal' | 'health' | 'finance' | 'study' | 'home' | 'other'
  | 'hotel' | 'airplane' | 'van' | 'pin' | 'clock' | 'bell' | 'tag' | 'check'
  | 'bed' | 'people' | 'music' | 'close' | 'chevronRight' | 'chevronDown' | 'chevronUp' | 'plus' | 'minus'
  | 'phone' | 'key' | 'refresh' | 'mic';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<IconName, IoniconsName> = {
  urgent:       'warning-outline',
  high:         'flash-outline',
  medium:       'location-outline',
  low:          'arrow-down-outline',
  work:         'briefcase-outline',
  personal:     'person-outline',
  health:       'fitness-outline',
  finance:      'wallet-outline',
  study:        'book-outline',
  home:         'home-outline',
  other:        'list-outline',
  hotel:        'business-outline',
  airplane:     'airplane-outline',
  van:          'car-outline',
  pin:          'pin-outline',
  clock:        'time-outline',
  bell:         'notifications-outline',
  tag:          'pricetag-outline',
  check:        'checkmark-outline',
  bed:          'bed-outline',
  people:       'people-outline',
  music:        'musical-notes-outline',
  close:        'close-outline',
  chevronRight: 'chevron-forward-outline',
  chevronDown:  'chevron-down-outline',
  chevronUp:    'chevron-up-outline',
  plus:         'add-outline',
  minus:        'remove-outline',
  phone:        'call-outline',
  key:          'key-outline',
  refresh:      'refresh-outline',
  mic:          'mic-outline',
};

interface Props { name: IconName; color?: string; size?: number; fill?: string }

export function Icon({ name, color = '#fff', size = 16 }: Props) {
  return <Ionicons name={ICON_MAP[name]} size={size} color={color} />;
}
