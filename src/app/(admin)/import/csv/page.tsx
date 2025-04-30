"use client";

import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Papa from "papaparse";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { checkUserPermission } from "@/lib/permissions"; // Import permission checker

// Define the expected database columns for mapping
const DB_COLUMNS = [
  "title", "description", "source_url", "source_name", "thumbnail_url",
  "author_name", "author_url", "license", "tags", "file_formats",
  "category", "part_number", "sku", "manufacturer", "cost_price",
  "retail_price", "is_free", "dimensions", "weight", "material",
  // Add other relevant columns from your schema
];

type Mapping = { [key: string]: string };

type ImportResult = {
  message: string;
  jobId: string;
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
};

export default function CsvImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Mapping>({});
  const [delimiter, setDelimiter] = React.useState<string>(",");
  const [previewData, setPreviewData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);

  // Check permission on mount
  React.useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      checkUserPermission(session.user.id, "import:csv").then(permissionResult => {
        setHasPermission(permissionResult);
        if (!permissionResult) {
          setError("You do not have permission to import CSV files.");
        }
      });
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session, router]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setImportResult(null);
      setHeaders([]);
      setMapping({});
      setPreviewData([]);

      // Auto-detect delimiter (simple check)
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const firstLine = text.split("\n")[0];
          if (firstLine.includes("\t")) setDelimiter("\t");
          else if (firstLine.includes(";")) setDelimiter(";");
          else setDelimiter(",");

          // Parse headers and preview
          Papa.parse(selectedFile, {
            header: true,
            preview: 5, // Show first 5 data rows
            skipEmptyLines: true,
            delimiter: delimiter, // Use detected or default
            complete: (results) => {
              if (results.meta.fields) {
                setHeaders(results.meta.fields);
                // Basic auto-mapping (can be improved)
                const initialMapping: Mapping = {};
                results.meta.fields.forEach(header => {
                  const lowerHeader = header.toLowerCase().replace(/\s+/g, "_");
                  const matchedColumn = DB_COLUMNS.find(dbCol => dbCol === lowerHeader);
                  if (matchedColumn) {
                    initialMapping[header] = matchedColumn;
                  }
                });
                setMapping(initialMapping);
              }
              setPreviewData(results.data);
            },
          });
        }
      };
      reader.readAsText(selectedFile.slice(0, 1024)); // Read first KB for detection
    }
  };

  const handleMappingChange = (csvHeader: string, dbColumn: string) => {
    setMapping(prev => ({ ...prev, [csvHeader]: dbColumn }));
  };

  const handleImport = async () => {
    if (!file || Object.keys(mapping).length === 0 || !hasPermission) {
      setError("Please select a file, ensure columns are mapped, and you have permission.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    formData.append("delimiter", delimiter);

    try {
      const response = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      const resultData = await response.json();

      if (!response.ok) {
        throw new Error(resultData.error || "Import failed");
      }

      setImportResult(resultData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || hasPermission === null) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (hasPermission === false) {
    return <div className="container mx-auto p-8 text-red-500">Error: {error || "Access Denied"}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-2xl font-bold">CSV Import</h1>

      <div className="space-y-4">
        <Label htmlFor="csv-file">Select CSV File</Label>
        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      {file && (
        <>
          <div className="space-y-2">
            <Label>Detected Delimiter: {delimiter === "\t" ? "Tab" : delimiter}</Label>
            {/* Allow changing delimiter if needed */}
          </div>

          <h2 className="text-xl font-semibold">Column Mapping</h2>
          <p className="text-sm text-muted-foreground">Map CSV columns to database fields.</p>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Header</TableHead>
                  <TableHead>Database Field</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header) => (
                  <TableRow key={header}>
                    <TableCell>{header}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping[header] || ""}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Ignore --</SelectItem>
                          {DB_COLUMNS.map((dbCol) => (
                            <SelectItem key={dbCol} value={dbCol}>
                              {dbCol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h2 className="text-xl font-semibold">Data Preview (First 5 Rows)</h2>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((row, index) => (
                  <TableRow key={index}>
                    {headers.map((header) => (
                      <TableCell key={header}>{row[header]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? "Importing..." : "Start Import"}
          </Button>
        </>
      )}

      {error && <p className="text-red-500">Error: {error}</p>}

      {importResult && (
        <div className="mt-8 p-4 border rounded-md bg-secondary/50">
          <h2 className="text-lg font-semibold">Import Results (Job ID: {importResult.jobId})</h2>
          <p>Status: {importResult.message}</p>
          <p>Total Rows Processed: {importResult.totalRows}</p>
          <p>Rows Imported: {importResult.imported}</p>
          <p>Duplicate Rows Skipped: {importResult.duplicates}</p>
          <p>Rows with Errors: {importResult.errors}</p>
          {importResult.errorDetails && importResult.errorDetails.length > 0 && (
            <div>
              <h3 className="font-medium mt-2">Error Details (First 5):</h3>
              <ul className="list-disc list-inside text-sm text-red-600">
                {importResult.errorDetails.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

