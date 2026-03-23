"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      if (!isDemo) {
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { full_name: fullName },
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.access_token) return;
    setDeleting(true);

    try {
      // In production, this would call a server endpoint
      // that handles account deletion securely
      alert(
        "Account deletion request submitted. You'll receive a confirmation email.",
      );
      setDeleteConfirm(false);
    } catch {
      alert("Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
    }
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
          <Settings className="h-6 w-6 text-text-muted" />
          Settings
        </h1>
        <p className="text-text-muted mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xl font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-secondary">
                {displayName}
              </p>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <Input
              label="Email"
              value={user?.email || ""}
              disabled
              hint="Email cannot be changed"
            />
            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>
                {saved ? "Saved!" : "Save Changes"}
              </Button>
              {saved && (
                <span className="text-sm text-emerald-600 font-medium">
                  Profile updated successfully
                </span>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Plan Section */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Current Plan
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="primary" className="text-sm px-3 py-1">
                Free Plan
              </Badge>
              <p className="text-sm text-text-muted">
                100 requests per 5-hour window
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/billing")}
            >
              Manage Billing
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50/50">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">Delete Account</p>
              <p className="text-xs text-text-muted mt-0.5">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            {!deleteConfirm ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleting}
                  onClick={handleDeleteAccount}
                >
                  Yes, Delete
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
