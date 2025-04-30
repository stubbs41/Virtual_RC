"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Define the type for a scraping target based on the schema
type ScrapingTarget = {
  id: string;
  target_url: string;
  source_name: string;
  is_active: boolean;
  frequency: string | null; // Interval type represented as string
  last_scrape_attempt: string | null;
  last_scrape_success: string | null;
  created_at: string;
  selectors: any | null; // JSONB
};

const formSchema = z.object({
  target_url: z.string().url({ message: "Please enter a valid URL." }),
  source_name: z.string().min(1, { message: "Source name is required." }),
  is_active: z.boolean().default(true),
  frequency: z.string().optional().nullable(), // e.g., "1 day", "7 days"
  selectors: z.string().optional().nullable(), // Input as JSON string
});

export default function ScrapeImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [targets, setTargets] = React.useState<ScrapingTarget[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  // TODO: Add permission check based on session/user roles later
  // React.useEffect(() => {
  //   if (status === "unauthenticated") {
  //     router.push("/login");
  //   } else if (status === "authenticated" /* && !userHasPermission("manage:scraping_targets") */) {
  //     // router.push("/unauthorized");
  //   }
  // }, [status, router]);

  const fetchTargets = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scraping-targets");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch scraping targets");
      }
      const data = await response.json();
      setTargets(data.targets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (status === "authenticated") {
      fetchTargets();
    }
  }, [status, fetchTargets]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_url: "",
      source_name: "",
      is_active: true,
      frequency: null,
      selectors: null,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setFormError(null);
    setIsLoading(true);
    let selectorsJson = null;
    if (values.selectors) {
      try {
        selectorsJson = JSON.parse(values.selectors);
      } catch (e) {
        setFormError("Selectors must be valid JSON.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/scraping-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, selectors: selectorsJson }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to add target");
      }
      form.reset(); // Reset form on success
      fetchTargets(); // Refresh the list
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleTargetStatus = async (targetId: string, currentStatus: boolean) => {
    // Optimistic update (optional)
    // setTargets(prev => prev.map(t => t.id === targetId ? { ...t, is_active: !currentStatus } : t));
    setError(null);
    try {
      const response = await fetch(`/api/scraping-targets?id=${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update target status");
        // Revert optimistic update if needed
      }
      // Refresh list on success
      fetchTargets();
    } catch (err: any) {
      setError(err.message);
      // Revert optimistic update if needed
    }
  };

  const triggerScrape = async (targetId: string) => {
    setError(null);
    setIsLoading(true);
    try {
        const response = await fetch("/api/import/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetId }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to trigger scrape");
        }
        const result = await response.json();
        alert(`Scrape job started: ${result.jobId}. Status: ${result.status}`);
        // Optionally refresh targets list to show updated last_scrape_attempt
        fetchTargets();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">Manage Web Scraping Targets</h1>

      {/* Add New Target Form */}
      <div className="border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Add New Target</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="target_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/products" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Example Store" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1 day, 7 days" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>PostgreSQL interval format (e.g., "1 day", "1 week", "1 month"). Leave blank for manual trigger only.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="selectors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selectors (Optional, JSON)</FormLabel>
                  <FormControl>
                    <Textarea placeholder={"{ \"item\": \".product-card\", \"title\": \".title\", \"price\": \".price\" }"} {...field} value={field.value ?? ""} rows={4} />
                  </FormControl>
                  <FormDescription>JSON object defining CSS selectors for scraping (structure depends on scraper implementation).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Enable automatic scraping based on frequency (if set).
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {formError && <p className="text-red-500">{formError}</p>}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Target"}
            </Button>
          </form>
        </Form>
      </div>

      {/* Existing Targets Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Existing Targets</h2>
        {error && <p className="text-red-500 mb-4">Error: {error}</p>}
        {isLoading && targets.length === 0 && <p>Loading targets...</p>}
        {!isLoading && targets.length === 0 && <p>No scraping targets defined yet.</p>}
        {targets.length > 0 && (
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Success</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>{target.source_name}</TableCell>
                    <TableCell><a href={target.target_url} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-xs block">{target.target_url}</a></TableCell>
                    <TableCell>
                      <Switch
                        checked={target.is_active}
                        onCheckedChange={() => toggleTargetStatus(target.id, target.is_active)}
                        aria-label={target.is_active ? "Deactivate" : "Activate"}
                      />
                    </TableCell>
                    <TableCell>{target.frequency || "Manual"}</TableCell>
                    <TableCell>{target.last_scrape_success ? new Date(target.last_scrape_success).toLocaleString() : "Never"}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => triggerScrape(target.id)} disabled={isLoading}>
                        Scrape Now
                      </Button>
                      {/* Add Edit/Delete buttons later */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
