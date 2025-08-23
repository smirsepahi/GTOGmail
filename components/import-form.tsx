"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Users, CheckCircle } from "lucide-react"

// Schema for file validation - using any for FileList to avoid SSR issues
const csvFormSchema = z.object({
  file: z.any().refine((files) => {
    if (typeof window === 'undefined') return true // Skip validation on server
    return files && files.length === 1
  }, {
    message: "Please select a file",
  }),
  hasHeaders: z.boolean().default(true),
})

type CsvFormValues = z.infer<typeof csvFormSchema>

export function ImportForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)

  const form = useForm<CsvFormValues>({
    resolver: zodResolver(csvFormSchema),
    defaultValues: {
      hasHeaders: true,
    },
  })

  const onSubmit = async (data: CsvFormValues) => {
    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", data.file[0])
      formData.append("hasHeaders", data.hasHeaders.toString())

      const response = await fetch("http://localhost:3001/api/import/csv", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message,
          count: result.contacts?.length,
        })
        form.reset()
      } else {
        setUploadResult({
          success: false,
          message: result.error || "Upload failed",
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: "Network error. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Contacts
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import your contacts. The file should contain columns for name, email, phone, company, position, and notes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              {...form.register("file")}
              className="cursor-pointer"
            />
            {form.formState.errors.file && (
              <p className="text-sm text-red-500">{form.formState.errors.file.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasHeaders"
              checked={form.watch("hasHeaders")}
              onCheckedChange={(checked) => form.setValue("hasHeaders", checked as boolean)}
            />
            <Label htmlFor="hasHeaders" className="text-sm font-normal">
              File contains headers (first row)
            </Label>
          </div>

          <Button type="submit" disabled={isUploading} className="w-full">
            {isUploading ? (
              <>
                <FileText className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Import Contacts
              </>
            )}
          </Button>
        </form>

        {uploadResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            uploadResult.success 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="font-medium">
                {uploadResult.success ? "Success!" : "Error"}
              </span>
            </div>
            <p className="mt-1 text-sm">{uploadResult.message}</p>
            {uploadResult.success && uploadResult.count && (
              <p className="mt-1 text-sm">
                Imported {uploadResult.count} contact{uploadResult.count !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">CSV Format Example:</h4>
          <pre className="text-xs text-gray-600">
{`name,email,phone,company,position,notes
John Doe,john@example.com,555-0123,Acme Corp,Manager,Met at conference
Jane Smith,jane@example.com,555-0124,Tech Inc,Developer,Follow up needed`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
} 