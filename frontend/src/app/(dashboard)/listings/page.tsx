"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api-client";
import { formatDate, truncate } from "@/lib/utils";
import { PLATFORMS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import type { ListingResponse } from "@/types/api";
import {
  Plus,
  FileText,
  ExternalLink,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const IS_DEMO =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function ListingsPage() {
  const { session } = useAuth();
  const [listings, setListings] = useState<ListingResponse[]>([]);
  const [loading, setLoading] = useState(!IS_DEMO);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      // Skip API calls in demo mode
      if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = (await api.getListings(session.access_token, page)) as {
          items: ListingResponse[];
        };
        setListings(data?.items || []);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [session?.access_token, page]);

  const handleDelete = async (id: string) => {
    if (!session?.access_token) return;
    if (!confirm("Are you sure you want to delete this listing?")) return;

    setDeleting(id);
    try {
      await api.deleteListing(id, session.access_token);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("Failed to delete listing. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Listings</h1>
          <p className="text-text-muted mt-1">
            Manage your AI-generated product listings
          </p>
        </div>
        <Link href="/listings/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No listings yet"
          description="Create your first AI-powered product listing to start selling smarter."
          actionLabel="Create Listing"
          onAction={() => (window.location.href = "/listings/new")}
        />
      ) : (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Product
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Platform
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden md:table-cell">
                      Title
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map((listing) => {
                    const platformKey = listing.platform as keyof typeof PLATFORMS;
                    const platform = PLATFORMS[platformKey];
                    return (
                      <tr
                        key={listing.id}
                        className="hover:bg-surface-alt/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-text">
                            {listing.product_name}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {platform ? (
                            <Badge
                              style={{
                                backgroundColor: `${platform.color}15`,
                                color: platform.color,
                              }}
                            >
                              {platform.name}
                            </Badge>
                          ) : (
                            <Badge>{listing.platform}</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-text-muted">
                            {truncate(listing.generated_title || "—", 50)}
                          </p>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <p className="text-sm text-text-muted">
                            {formatDate(listing.created_at)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/listings/${listing.id}`}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(listing.id)}
                              disabled={deleting === listing.id}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Page {page}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={listings.length < 20}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
