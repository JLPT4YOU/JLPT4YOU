"use client"

import { useState } from "react";
import { CreditCard, Wallet, QrCode, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslations } from "@/hooks/use-translations";
import { AmountSelector } from "./amount-selector";
import { PaymentMethodSelector } from "./payment-method-selector";

export function TopUpInterface() {
  const { t } = useTranslations();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [step, setStep] = useState<"amount" | "payment" | "processing">("amount");

  const handleAmountSelect = (amount: number | "custom") => {
    if (amount === "custom") {
      setSelectedAmount(null);
    } else {
      setSelectedAmount(amount);
      setCustomAmount("");
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getFinalAmount = () => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseFloat(customAmount);
    return 0;
  };

  const canProceed = () => {
    const amount = getFinalAmount();
    return amount > 0 && amount <= 1000; // Max $1000 limit
  };

  const handleContinue = () => {
    if (step === "amount" && canProceed()) {
      setStep("payment");
    } else if (step === "payment" && selectedPaymentMethod) {
      setStep("processing");
      // Here you would integrate with actual payment processing
      setTimeout(() => {
        alert(`Processing $${getFinalAmount()} payment via ${selectedPaymentMethod}`);
        // Reset form
        setStep("amount");
        setSelectedAmount(null);
        setCustomAmount("");
        setSelectedPaymentMethod("");
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step === "payment") {
      setStep("amount");
    } else if (step === "processing") {
      setStep("payment");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t ? t('pages.topup.title') : 'Top Up Account'}
        </h1>
        <p className="text-muted-foreground">
          {t ? t('pages.topup.description') : 'Add credits to your account'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === "amount" ? "bg-primary text-primary-foreground" : 
            step === "payment" || step === "processing" ? "bg-primary text-primary-foreground" : 
            "bg-muted text-muted-foreground"
          }`}>
            1
          </div>
          <div className={`h-px w-12 ${
            step === "payment" || step === "processing" ? "bg-primary" : "bg-muted"
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === "payment" ? "bg-primary text-primary-foreground" : 
            step === "processing" ? "bg-primary text-primary-foreground" : 
            "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
          <div className={`h-px w-12 ${
            step === "processing" ? "bg-primary" : "bg-muted"
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === "processing" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-16 text-sm">
          <span className={step === "amount" ? "text-primary font-medium" : "text-muted-foreground"}>
            {t ? t('topup.steps.amount') : 'Select Amount'}
          </span>
          <span className={step === "payment" ? "text-primary font-medium" : "text-muted-foreground"}>
            {t ? t('topup.steps.payment') : 'Payment Method'}
          </span>
          <span className={step === "processing" ? "text-primary font-medium" : "text-muted-foreground"}>
            {t ? t('topup.steps.confirm') : 'Confirm'}
          </span>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {step === "amount" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t ? t('topup.selectAmount') : 'Select Top-up Amount'}
                </h3>
                <AmountSelector
                  selectedAmount={selectedAmount}
                  customAmount={customAmount}
                  onAmountSelect={handleAmountSelect}
                  onCustomAmountChange={handleCustomAmountChange}
                />
              </div>
              
              {getFinalAmount() > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {t ? t('topup.total') : 'Total Amount:'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ${getFinalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {t ? t('topup.selectPayment') : 'Select Payment Method'}
                </h3>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {t ? t('topup.amount') : 'Amount'}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    ${getFinalAmount().toFixed(2)}
                  </div>
                </div>
              </div>
              
              <PaymentMethodSelector
                selectedMethod={selectedPaymentMethod}
                onMethodSelect={setSelectedPaymentMethod}
              />
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t ? t('topup.processing') : 'Processing Payment...'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t ? t('topup.processingDesc') : 'Please wait while we process your payment'}
              </p>
              <div className="bg-muted/50 rounded-lg p-4 max-w-sm mx-auto">
                <div className="flex justify-between text-sm mb-2">
                  <span>{t ? t('topup.amount') : 'Amount'}:</span>
                  <span className="font-medium">${getFinalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t ? t('topup.method') : 'Method'}:</span>
                  <span className="font-medium capitalize">{selectedPaymentMethod}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {step !== "processing" && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === "amount"}
            className="min-w-24"
          >
            {t ? t('common.back') : 'Back'}
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={
              (step === "amount" && !canProceed()) ||
              (step === "payment" && !selectedPaymentMethod)
            }
            className="min-w-24"
          >
            {step === "amount" 
              ? (t ? t('common.continue') : 'Continue')
              : (t ? t('topup.payNow') : 'Pay Now')
            }
          </Button>
        </div>
      )}
    </div>
  );
}
