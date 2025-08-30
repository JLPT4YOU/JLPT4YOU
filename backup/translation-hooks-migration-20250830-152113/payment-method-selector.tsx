"use client"

import { QrCode, CreditCard, Building2, Smartphone, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/hooks/use-translations";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodSelect: (method: string) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect
}: PaymentMethodSelectorProps) {
  const { t } = useTranslations();

  const paymentMethods = [
    {
      id: "qr-vietnam",
      name: t ? t('topup.methods.qrVietnam') : "QR Việt Nam",
      description: t ? t('topup.methods.qrVietnameDesc') : "VietQR, VNPAY, ZaloPay, MoMo",
      icon: QrCode,
      color: "text-foreground",
      bgColor: "bg-card",
      popular: true
    },
    {
      id: "paypal",
      name: "PayPal",
      description: t ? t('topup.methods.paypalDesc') : "Secure international payments",
      icon: CreditCard,
      color: "text-foreground",
      bgColor: "bg-card",
      popular: false
    },
    {
      id: "paypay",
      name: "PayPay",
      description: t ? t('topup.methods.paypayDesc') : "Japanese mobile payment",
      icon: Smartphone,
      color: "text-foreground",
      bgColor: "bg-card",
      popular: false
    },
    {
      id: "stripe",
      name: "Stripe",
      description: t ? t('topup.methods.stripeDesc') : "Credit/Debit cards worldwide",
      icon: CreditCard,
      color: "text-foreground",
      bgColor: "bg-card",
      popular: true
    },
    {
      id: "bank-transfer",
      name: t ? t('topup.methods.bankTransfer') : "Bank Transfer",
      description: t ? t('topup.methods.bankTransferDesc') : "Direct bank account transfer",
      icon: Building2,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      popular: false
    }
  ];

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMethod} onValueChange={onMethodSelect}>
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div key={method.id} className="relative">
              <Label
                htmlFor={method.id}
                className="cursor-pointer"
              >
                <Card
                  interactive
                  className={`transition-all duration-200 ${
                    isSelected
                      ? "ring-2 ring-primary border-primary shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="mt-1"
                      />
                      
                      <div className={`p-3 rounded-lg ${method.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${method.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-bold text-foreground">
                            {method.name}
                          </h4>
                          {method.popular && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {t ? t('topup.popular') : 'Popular'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {method.description}
                        </p>
                      </div>
                      
                      {/* Processing time indicator */}
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {method.id === "qr-vietnam" && (t ? t('topup.instant') : 'Instant')}
                          {method.id === "paypal" && (t ? t('topup.instant') : 'Instant')}
                          {method.id === "paypay" && (t ? t('topup.instant') : 'Instant')}
                          {method.id === "stripe" && (t ? t('topup.instant') : 'Instant')}
                          {method.id === "bank-transfer" && (t ? t('topup.businessDays') : '1-3 days')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {/* Additional Information */}
      {selectedMethod && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h5 className="font-medium text-sm">
                {t ? t('topup.paymentInfo') : 'Payment Information'}
              </h5>
              
              {selectedMethod === "qr-vietnam" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {t ? t('topup.info.qrVietnam1') : 'Scan QR code with your banking app'}</p>
                  <p>• {t ? t('topup.info.qrVietnam2') : 'Supports all major Vietnamese banks'}</p>
                  <p>• {t ? t('topup.info.qrVietnam3') : 'Instant processing, no fees'}</p>
                </div>
              )}
              
              {selectedMethod === "paypal" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {t ? t('topup.info.paypal1') : 'Login to your PayPal account'}</p>
                  <p>• {t ? t('topup.info.paypal2') : 'Secure international payments'}</p>
                  <p>• {t ? t('topup.info.paypal3') : 'Small processing fee may apply'}</p>
                </div>
              )}
              
              {selectedMethod === "paypay" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {t ? t('topup.info.paypay1') : 'Use PayPay mobile app'}</p>
                  <p>• {t ? t('topup.info.paypay2') : 'Popular in Japan'}</p>
                  <p>• {t ? t('topup.info.paypay3') : 'Instant processing'}</p>
                </div>
              )}
              
              {selectedMethod === "stripe" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {t ? t('topup.info.stripe1') : 'Visa, Mastercard, American Express'}</p>
                  <p>• {t ? t('topup.info.stripe2') : 'Secure SSL encryption'}</p>
                  <p>• {t ? t('topup.info.stripe3') : 'Instant processing'}</p>
                </div>
              )}
              
              {selectedMethod === "bank-transfer" && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• {t ? t('topup.info.bank1') : 'Transfer to our bank account'}</p>
                  <p>• {t ? t('topup.info.bank2') : 'Include reference number'}</p>
                  <p>• {t ? t('topup.info.bank3') : 'Processing: 1-3 business days'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
