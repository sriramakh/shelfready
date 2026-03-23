"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Check,
  ChevronRight,
  ExternalLink,
  Crown,
} from "lucide-react";

const planEntries = Object.entries(PLANS) as [
  keyof typeof PLANS,
  (typeof PLANS)[keyof typeof PLANS],
][];

export default function BillingPage() {
  const { session } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleUpgrade = async (planKey: string) => {
    if (!session?.access_token) return;
    setLoadingPlan(planKey);

    try {
      const data = (await api.createCheckout(
        { plan: planKey, billing_period: annual ? "yearly" : "monthly" },
        session.access_token,
      )) as { url: string };

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!session?.access_token) return;
    setLoadingPortal(true);

    try {
      const data = (await api.createPortal(session.access_token)) as {
        url: string;
      };

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-text-muted" />
          Billing
        </h1>
        <p className="text-text-muted mt-1">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary">
            Current Subscription
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold text-secondary">
                    Free Plan
                  </p>
                  <Badge variant="primary">Active</Badge>
                </div>
                <p className="text-sm text-text-muted mt-0.5">
                  100 requests per 5-hour window &middot; 5 listings/month
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              loading={loadingPortal}
            >
              <ExternalLink className="h-4 w-4" />
              Manage Billing
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full bg-surface-alt border border-border p-1">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer",
              !annual
                ? "bg-white text-text shadow-sm"
                : "text-text-muted hover:text-text",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer",
              annual
                ? "bg-white text-text shadow-sm"
                : "text-text-muted hover:text-text",
            )}
          >
            Yearly
            <span className="ml-1.5 text-xs text-primary font-semibold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {planEntries.map(([key, plan]) => {
          const isPopular = "popular" in plan && plan.popular;
          const isCurrent = key === "free";
          const price = annual
            ? Math.round(plan.priceYearly / 12)
            : plan.priceMonthly;

          return (
            <Card
              key={key}
              className={cn(
                isPopular && "border-primary ring-1 ring-primary/20",
                isCurrent && "bg-surface-alt/50",
              )}
            >
              <CardBody className="flex flex-col h-full">
                {isPopular && (
                  <Badge variant="primary" className="self-start mb-3">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-base font-semibold text-secondary">
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-secondary">
                    ${price}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-text-muted">/mo</span>
                  )}
                </div>

                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-text-muted"
                    >
                      <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? "primary" : "outline"}
                      size="sm"
                      className="w-full"
                      loading={loadingPlan === key}
                      onClick={() => handleUpgrade(key)}
                    >
                      Upgrade
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
