"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: React.ReactNode;
  className?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  icon,
  className
}) => {
  const { t } = useTranslations();

  // Use translation keys with fallbacks
  const modalTitle = title || t('modals.confirmation.title');
  const modalDescription = description || t('modals.confirmation.defaultMessage');
  const modalConfirmText = confirmText || t('modals.confirmation.confirm');
  const modalCancelText = cancelText || t('modals.confirmation.cancel');
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const defaultIcon = variant === 'destructive' ? (
    <AlertTriangle className="h-6 w-6 text-destructive" />
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {icon || defaultIcon}
            {modalTitle}
          </DialogTitle>
          <DialogDescription className="text-left">
            {modalDescription}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            {modalCancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
          >
            {variant === 'destructive' && <Trash2 className="mr-2 h-4 w-4" />}
            {modalConfirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
