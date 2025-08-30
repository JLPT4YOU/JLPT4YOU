"use client"

import { useState } from "react";
import { DollarSign, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";

interface AmountSelectorProps {
  selectedAmount: number | null;
  customAmount: string;
  onAmountSelect: (amount: number | "custom") => void;
  onCustomAmountChange: (value: string) => void;
}

export function AmountSelector({
  selectedAmount,
  customAmount,
  onAmountSelect,
  onCustomAmountChange
}: AmountSelectorProps) {
  const { t } = useTranslations();
  const [isCustomMode, setIsCustomMode] = useState(false);

  const predefinedAmounts = [1, 5, 10, 50, 100];

  const handleCustomClick = () => {
    setIsCustomMode(true);
    onAmountSelect("custom");
  };

  const handlePredefinedClick = (amount: number) => {
    setIsCustomMode(false);
    onAmountSelect(amount);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      onCustomAmountChange(value);
    }
  };

  return (
    <div className="space-y-4">
      {/* Predefined Amounts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {predefinedAmounts.map((amount) => (
          <Button
            key={amount}
            variant={selectedAmount === amount ? "default" : "outline"}
            className={`h-16 flex flex-col items-center justify-center space-y-1 ${
              selectedAmount === amount 
                ? "bg-primary text-primary-foreground border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handlePredefinedClick(amount)}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-lg font-bold">${amount}</span>
          </Button>
        ))}
        
        {/* Custom Amount Button */}
        <Button
          variant={isCustomMode ? "default" : "outline"}
          className={`h-16 flex flex-col items-center justify-center space-y-1 ${
            isCustomMode 
              ? "bg-primary text-primary-foreground border-primary" 
              : "hover:border-primary/50"
          }`}
          onClick={handleCustomClick}
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-lg font-bold">
            {t ? t('topup.custom') : 'Custom'}
          </span>
        </Button>
      </div>

      {/* Custom Amount Input */}
      {isCustomMode && (
        <div className="space-y-2">
          <Label htmlFor="custom-amount" className="text-sm font-medium">
            {t ? t('topup.enterAmount') : 'Enter Custom Amount'}
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="custom-amount"
              type="text"
              placeholder="0.00"
              value={customAmount}
              onChange={handleCustomInputChange}
              className="pl-10 text-lg font-medium"
              autoFocus
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t ? t('topup.minAmount') : 'Minimum: $1.00'}</span>
            <span>{t ? t('topup.maxAmount') : 'Maximum: $1,000.00'}</span>
          </div>
          
          {/* Validation Messages */}
          {customAmount && (
            <div className="text-sm">
              {parseFloat(customAmount) < 1 && (
                <p className="text-destructive">
                  {t ? t('topup.errors.tooLow') : 'Amount must be at least $1.00'}
                </p>
              )}
              {parseFloat(customAmount) > 1000 && (
                <p className="text-destructive">
                  {t ? t('topup.errors.tooHigh') : 'Amount cannot exceed $1,000.00'}
                </p>
              )}
              {parseFloat(customAmount) >= 1 && parseFloat(customAmount) <= 1000 && (
                <p className="text-green-600">
                  {t ? t('topup.validAmount') : 'Valid amount'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Amount Suggestions for Custom */}
      {isCustomMode && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {t ? t('topup.quickSuggestions') : 'Quick suggestions:'}
          </Label>
          <div className="flex flex-wrap gap-2">
            {[25, 75, 150, 200, 500].map((amount) => (
              <Button
                key={amount}
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => onCustomAmountChange(amount.toString())}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
