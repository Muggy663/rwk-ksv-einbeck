'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/migration/excel-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Fehler beim Import: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Schützen-Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Excel-Datei auswählen
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileSpreadsheet className="h-4 w-4" />
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importiere...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import starten
              </>
            )}
          </Button>

          {result && (
            <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.success ? 'Import erfolgreich' : 'Import fehlgeschlagen'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {result.message || result.error}
                </p>

                {result.details && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Importiert: {result.details.imported}</div>
                    <div>Übersprungen: {result.details.skipped}</div>
                    <div>Gesamt: {result.details.total_rows}</div>
                    
                    {result.details.errors?.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium">Fehler:</div>
                        {result.details.errors.map((error: string, i: number) => (
                          <div key={i} className="text-red-600">{error}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}