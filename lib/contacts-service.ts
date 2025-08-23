export interface Contact {
  id: string
  name: string
  email: string
  company: string
  position?: string
  notes?: string
  addedAt: string
  updatedAt?: string
  contacted: boolean
  lastContactDate?: string | null
  daysSinceContact?: number | null
}

export interface CreateContactRequest {
  name: string
  email: string
  company: string
  position?: string
  notes?: string
}

export interface UpdateContactRequest {
  name?: string
  email?: string
  company?: string
  position?: string
  notes?: string
  contacted?: boolean
  lastContactDate?: string
}

class ContactsService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

  async getAllContacts(): Promise<Contact[]> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching contacts:', error)
      throw error
    }
  }

  async getContact(id: string): Promise<Contact> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Contact not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching contact:', error)
      throw error
    }
  }

  async createContact(contactData: CreateContactRequest): Promise<Contact> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating contact:', error)
      throw error
    }
  }

  async updateContact(id: string, contactData: UpdateContactRequest): Promise<Contact> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          throw new Error('Contact not found')
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating contact:', error)
      throw error
    }
  }

  async deleteContact(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Contact not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      throw error
    }
  }

  async refreshContactStatus(id: string): Promise<Contact> {
    try {
      // This will trigger a fresh check of the contact's status via Gmail API
      return await this.getContact(id)
    } catch (error) {
      console.error('Error refreshing contact status:', error)
      throw error
    }
  }

  async refreshAllContactsStatus(): Promise<Contact[]> {
    try {
      // This will trigger a fresh check of all contacts' status via Gmail API
      return await this.getAllContacts()
    } catch (error) {
      console.error('Error refreshing all contacts status:', error)
      throw error
    }
  }

  // Helper methods for contact status
  getContactStatusText(contact: Contact): string {
    if (!contact.contacted) {
      return 'Not contacted'
    }

    if (contact.daysSinceContact === null || contact.daysSinceContact === undefined) {
      return 'Contacted'
    }

    if (contact.daysSinceContact === 0) {
      return 'Contacted today'
    } else if (contact.daysSinceContact === 1) {
      return 'Contacted 1 day ago'
    } else {
      return `Contacted ${contact.daysSinceContact} days ago`
    }
  }

  getContactStatusColor(contact: Contact): string {
    if (!contact.contacted) {
      return 'text-gray-500'
    }

    if (contact.daysSinceContact === null || contact.daysSinceContact === undefined) {
      return 'text-green-600'
    }

    if (contact.daysSinceContact <= 7) {
      return 'text-green-600'
    } else if (contact.daysSinceContact <= 30) {
      return 'text-yellow-600'
    } else {
      return 'text-red-600'
    }
  }

  // Search and filter methods
  searchContacts(contacts: Contact[], searchTerm: string): Contact[] {
    if (!searchTerm.trim()) {
      return contacts
    }

    const term = searchTerm.toLowerCase()
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.email.toLowerCase().includes(term) ||
      contact.company.toLowerCase().includes(term) ||
      (contact.position && contact.position.toLowerCase().includes(term))
    )
  }

  filterContactsByStatus(contacts: Contact[], status: 'all' | 'contacted' | 'not-contacted'): Contact[] {
    if (status === 'all') {
      return contacts
    }

    return contacts.filter(contact =>
      status === 'contacted' ? contact.contacted : !contact.contacted
    )
  }

  filterContactsByCompany(contacts: Contact[], companies: string[]): Contact[] {
    if (companies.length === 0) {
      return contacts
    }

    return contacts.filter(contact =>
      companies.some(company =>
        contact.company.toLowerCase().includes(company.toLowerCase())
      )
    )
  }

  // Bulk operations
  async bulkDeleteContacts(contactIds: string[]): Promise<void> {
    try {
      await Promise.all(contactIds.map(id => this.deleteContact(id)))
    } catch (error) {
      console.error('Error in bulk delete:', error)
      throw error
    }
  }

  // Export/Import functionality
  exportContactsToCSV(contacts: Contact[]): string {
    const headers = ['Name', 'Email', 'Company', 'Position', 'Notes', 'Added Date', 'Contact Status', 'Last Contact Date']
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        `"${contact.name}"`,
        `"${contact.email}"`,
        `"${contact.company}"`,
        `"${contact.position || ''}"`,
        `"${contact.notes || ''}"`,
        `"${new Date(contact.addedAt).toLocaleDateString()}"`,
        `"${this.getContactStatusText(contact)}"`,
        `"${contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : ''}"`
      ].join(','))
    ].join('\n')

    return csvContent
  }

  downloadContactsCSV(contacts: Contact[], filename = 'contacts.csv'): void {
    const csvContent = this.exportContactsToCSV(contacts)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export const contactsService = new ContactsService()
