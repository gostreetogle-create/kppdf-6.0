// ─── Core primitives ───────────────────────────────────────
export { Button, type ButtonProps } from './button';
export { Input, type InputProps } from './input';
export { Select, type SelectProps } from './select';
export { Textarea, type TextareaProps } from './textarea';
export { Label, type LabelProps } from './label';
export { Switch, type SwitchProps } from './switch';
export { Separator, type SeparatorProps } from './separator';

// ─── Layout ────────────────────────────────────────────────
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, type CardProps } from './card';
export { Container, Flex, Grid, Stack } from './layout';

// ─── Typography ────────────────────────────────────────────
export { Typography, H1, H2, H3, H4, P, Lead, Large, Small, Muted, Code, Blockquote, type TypographyProps } from './typography';

// ─── Feedback & Display ────────────────────────────────────
export { Badge, type BadgeProps } from './badge';
export { Spinner, type SpinnerProps } from './spinner';
export { Skeleton, type SkeletonProps } from './skeleton';
export { Progress, CircularProgress, type ProgressProps, type CircularProgressProps } from './progress';
export { Alert, AlertTitle, AlertDescription, type AlertProps } from './alert';
export { Icon, type IconProps } from './icon';
export { Avatar, AvatarGroup, type AvatarProps } from './avatar';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { ErrorBoundary } from './error-boundary';

// ─── Navigation ────────────────────────────────────────────
export { Breadcrumb, type BreadcrumbProps } from './breadcrumb';
export { DropdownMenu, type DropdownMenuProps } from './dropdown-menu';
export { Tabs } from './tabs';

// ─── Overlays ──────────────────────────────────────────────
export { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
export { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog';
export { ToastProvider, useToast } from './toast';
export { Tooltip } from './tooltip';
export { Popover } from './popover';
export { Sheet } from './sheet';
export { Accordion } from './accordion';

// ─── Data ──────────────────────────────────────────────────
export { Table, type Column, type TableProps } from './table';

// ─── Forms ─────────────────────────────────────────────────
export { FormField, FormSelect, FormTextarea, type FormFieldProps, type FormSelectProps, type FormTextareaProps } from './form-field';
export { Datepicker, type DatepickerProps } from './datepicker';

// ─── Specialized ───────────────────────────────────────────
export { GanttChart } from './gantt-chart';
export { BlockEditor } from './block-editor';
export { TextBlockDialog, TableBlockDialog, SeparatorBlockDialog } from './block-dialogs';
export { DocPreview } from './doc-preview';
export { ProposalPreview } from './proposal-preview';
export { ContractPreview } from './contract-preview';
export { A4Canvas } from './a4-canvas';
export { A4Page } from './a4-page';
export { SortableBlock } from './sortable-block';
