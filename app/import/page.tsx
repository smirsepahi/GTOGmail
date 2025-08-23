import { ImportForm } from "@/components/import-form"

export default function ImportPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Import Contacts</h1>
        <p className="text-gray-600 mt-2">
          Import your contacts from a CSV file to get started with your networking dashboard.
        </p>
      </div>
      <ImportForm />
    </div>
  )
} 