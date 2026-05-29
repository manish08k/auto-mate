/**
 * ui/index.js — barrel export
 * Import individual components to avoid bundle bloat:
 *
 *   import Button from '@/components/ui/Button';
 *   import { Skeleton, SkeletonText, PageLoader } from '@/components/ui/Loader';
 *   import { ToastProvider, useToast } from '@/components/ui/Toast';
 *
 * Or import everything:
 *   import { Button, Input, Modal, Dropdown, Toggle, Badge } from '@/components/ui';
 */

export { default as Button }   from './Button';
export { default as Input }    from './Input';
export { default as Modal }    from './Modal';
export { default as Dropdown } from './Dropdown';
export { default as Toggle }   from './Toggle';
export { default as Badge }    from './Badge';
export { default as Loader, Skeleton, SkeletonText, PageLoader } from './Loader';
export { default as Toast, ToastProvider, useToast } from './Toast';
