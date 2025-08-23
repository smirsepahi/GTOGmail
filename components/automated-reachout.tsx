"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Edit3,
  Trash2,
  Users,
  Mail,
  FileText,
  Clipboard,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { contactsService, Contact } from "@/lib/contacts-service"
import { gmailService } from "@/lib/gmail-service"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  createdAt: string
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Coffee Chat Request",
    subject: "Coffee Chat Opportunity - {name}",
    body: "Hi {name},\n\nI hope this email finds you well. I came across your profile and was impressed by your work at {company}.\n\nI'm currently exploring opportunities in {industry} and would love to learn more about your experience. Would you be open to a brief coffee chat sometime next week?\n\nI'm happy to work around your schedule.\n\nBest regards,\n{sender_name}",
    category: "Networking",
    createdAt: "2024-01-15"
  }
]

interface AutomatedReachoutProps {
  isEmailConnected: boolean
}

export function AutomatedReachout({ isEmailConnected }: AutomatedReachoutProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [activeTab, setActiveTab] = useState("templates")
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(true)

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    notes: ""
  })

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    category: "Networking"
  })

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    templateId: "",
    selectedContacts: [] as string[]
  })

  // Load contacts on component mount
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setContactsLoading(true)
      const loadedContacts = await contactsService.getAllContacts()
      setContacts(loadedContacts)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setContactsLoading(false)
    }
  }

  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      company: "",
      position: "",
      notes: ""
    })
    setEditingContact(null)
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      subject: "",
      body: "",
      category: "Networking"
    })
    setEditingTemplate(null)
  }

  const handleSaveContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.company) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)

      if (editingContact) {
        const updatedContact = await contactsService.updateContact(editingContact.id, {
          name: contactForm.name,
          email: contactForm.email,
          company: contactForm.company,
          position: contactForm.position,
          notes: contactForm.notes
        })
        setContacts(prev => prev.map(c => c.id === editingContact.id ? updatedContact : c))
        toast.success("Contact updated successfully")
      } else {
        const newContact = await contactsService.createContact({
          name: contactForm.name,
          email: contactForm.email,
          company: contactForm.company,
          position: contactForm.position,
          notes: contactForm.notes
        })
        setContacts(prev => [...prev, newContact])
        toast.success("Contact added successfully")
      }

      resetContactForm()
      setShowContactDialog(false)
    } catch (error: any) {
      console.error('Error saving contact:', error)
      toast.error(error.message || 'Failed to save contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await contactsService.deleteContact(contactId)
      setContacts(prev => prev.filter(c => c.id !== contactId))
      toast.success("Contact deleted successfully")
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      toast.error(error.message || 'Failed to delete contact')
    }
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setContactForm({
      name: contact.name,
      email: contact.email,
      company: contact.company,
      position: contact.position || "",
      notes: contact.notes || ""
    })
    setShowContactDialog(true)
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast.error("Please fill in all required fields")
      return
    }

    const template: EmailTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: templateForm.name,
      subject: templateForm.subject,
      body: templateForm.body,
      category: templateForm.category,
      createdAt: editingTemplate?.createdAt || new Date().toISOString().split('T')[0]
    }

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? template : t))
      toast.success("Template updated successfully")
    } else {
      setTemplates(prev => [...prev, template])
      toast.success("Template created successfully")
    }

    resetTemplateForm()
    setShowTemplateDialog(false)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category
    })
    setShowTemplateDialog(true)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    toast.success("Template deleted successfully")
  }

  const copyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body)
    toast.success("Template copied to clipboard")
  }

  // Personalize template with contact information
  const personalizeTemplate = (template: EmailTemplate, contact: Contact): { subject: string; body: string } => {
    const replacements = {
      '{name}': contact.name,
      '{company}': contact.company,
      '{position}': contact.position || 'team member',
      '{sender_name}': 'Your Name', // You could make this configurable
    }

    let personalizedSubject = template.subject
    let personalizedBody = template.body

    Object.entries(replacements).forEach(([placeholder, value]) => {
      personalizedSubject = personalizedSubject.replace(new RegExp(placeholder, 'g'), value)
      personalizedBody = personalizedBody.replace(new RegExp(placeholder, 'g'), value)
    })

    return {
      subject: personalizedSubject,
      body: personalizedBody
    }
  }

  // Send campaign emails
  const sendCampaign = async () => {
    if (!campaignForm.name || !campaignForm.templateId || campaignForm.selectedContacts.length === 0) {
      toast.error("Please fill in all fields and select at least one contact")
      return
    }

    if (!isEmailConnected) {
      toast.error("Please connect an email account first")
      return
    }

    const template = templates.find(t => t.id === campaignForm.templateId)
    if (!template) {
      toast.error("Selected template not found")
      return
    }

    const selectedContactsList = contacts.filter(c => campaignForm.selectedContacts.includes(c.id))

    try {
      setLoading(true)
      let successCount = 0
      let failureCount = 0
      const errors: string[] = []

      // Send emails to each contact
      for (const contact of selectedContactsList) {
        try {
          const personalizedEmail = personalizeTemplate(template, contact)

          console.log(`Sending email to ${contact.email}:`, {
            subject: personalizedEmail.subject,
            body: personalizedEmail.body.substring(0, 100) + '...'
          })

          const result = await gmailService.sendEmail({
            to: contact.email,
            subject: personalizedEmail.subject,
            body: personalizedEmail.body,
            isHtml: false
          })

          console.log(`Email sent successfully to ${contact.email}:`, result)

          // Update contact status to contacted
          try {
            await contactsService.updateContact(contact.id, {
              contacted: true,
              lastContactDate: new Date().toISOString()
            })

            // Update local state
            setContacts(prev => prev.map(c =>
              c.id === contact.id
                ? { ...c, contacted: true, lastContactDate: new Date().toISOString() }
                : c
            ))
          } catch (updateError) {
            console.warn('Failed to update contact status:', updateError)
          }

          successCount++

        } catch (emailError: any) {
          console.error(`Failed to send email to ${contact.email}:`, emailError)
          failureCount++

          let errorMessage = emailError.message || 'Unknown error'
          if (errorMessage.includes('Not authenticated')) {
            errorMessage = 'Gmail not connected - please connect your Gmail account first'
          }

          errors.push(`${contact.name} (${contact.email}): ${errorMessage}`)
        }
      }

      // Show results
      if (successCount > 0 && failureCount === 0) {
        toast.success(`Campaign "${campaignForm.name}" completed! ${successCount} emails sent successfully.`)
      } else if (successCount > 0 && failureCount > 0) {
        toast.success(`Campaign "${campaignForm.name}" partially completed! ${successCount} emails sent, ${failureCount} failed.`)
        console.error('Campaign errors:', errors)

        // Show detailed error for authentication issues
        if (errors.some(error => error.includes('Gmail not connected'))) {
          toast.error('Some emails failed: Gmail account not connected. Please connect Gmail in the Settings tab.')
        }
      } else {
        toast.error(`Campaign "${campaignForm.name}" failed! No emails were sent.`)
        console.error('Campaign errors:', errors)

        // Show specific error for authentication issues
        if (errors.some(error => error.includes('Gmail not connected'))) {
          toast.error('Campaign failed: Gmail account not connected. Please connect Gmail in the Settings tab first.')
        }
      }

      setShowCampaignDialog(false)
      setCampaignForm({ name: "", templateId: "", selectedContacts: [] })

    } catch (error: any) {
      console.error('Campaign error:', error)
      toast.error(`Campaign failed: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Reachout</h1>
          <p className="text-gray-600">Create templates, manage contacts, and automate your outreach</p>
        </div>

        {!isEmailConnected && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Connect an email account to send campaigns
            </span>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Email Templates</h2>
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetTemplateForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? "Edit Template" : "Create New Template"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Coffee Chat Request"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-category">Category</Label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="Networking">Networking</option>
                        <option value="Application">Application</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Introduction">Introduction</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="template-subject">Subject Line</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Use {name}, {company} for personalization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-body">Email Body</Label>
                    <Textarea
                      id="template-body"
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Use {name}, {company}, {position} for personalization"
                      rows={10}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate}>
                      {editingTemplate ? "Update" : "Create"} Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyTemplate(template)}
                        title="Copy to clipboard"
                      >
                        <Clipboard className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        title="Edit template"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Subject:</p>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Preview:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.body.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {template.createdAt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Contact Management</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadContacts}
                disabled={contactsLoading}
              >
                {contactsLoading ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Refresh Status
              </Button>
              <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetContactForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingContact ? "Edit Contact" : "Add New Contact"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-name">Name</Label>
                        <Input
                          id="contact-name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-email">Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact-company">Company</Label>
                        <Input
                          id="contact-company"
                          value={contactForm.company}
                          onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact-position">Position</Label>
                        <Input
                          id="contact-position"
                          value={contactForm.position}
                          onChange={(e) => setContactForm(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Software Engineer"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="contact-notes">Notes</Label>
                      <Textarea
                        id="contact-notes"
                        value={contactForm.notes}
                        onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this contact"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowContactDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveContact} disabled={loading}>
                        {loading ? (
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {editingContact ? "Update" : "Add"} Contact
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {contactsLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading contacts...</h3>
                <p className="text-gray-600">Please wait while we load your contacts</p>
              </CardContent>
            </Card>
          ) : contacts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-600 mb-4">Add your first contact to start building your network</p>
                <Button onClick={() => setShowContactDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        <p className="text-sm text-gray-600">{contact.position}</p>
                        <p className="text-sm font-medium text-blue-600">{contact.company}</p>
                        <div className="mt-1">
                          <Badge
                            variant={contact.contacted ? "default" : "secondary"}
                            className={contactsService.getContactStatusColor(contact)}
                          >
                            {contactsService.getContactStatusText(contact)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                          title="Edit contact"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          title="Delete contact"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{contact.email}</span>
                      </div>
                      {contact.notes && (
                        <div>
                          <p className="text-sm text-gray-600">{contact.notes}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Added: {new Date(contact.addedAt).toLocaleDateString()}
                      </div>
                      {contact.lastContactDate && (
                        <div className="text-xs text-gray-500">
                          Last contact: {new Date(contact.lastContactDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Email Campaigns</h2>
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button
                  disabled={templates.length === 0 || contacts.length === 0}
                  onClick={() => setCampaignForm({ name: "", templateId: "", selectedContacts: [] })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Email Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaign-name">Campaign Name</Label>
                    <Input
                      id="campaign-name"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Q1 Networking Outreach"
                    />
                  </div>

                  <div>
                    <Label htmlFor="campaign-template">Email Template</Label>
                    <select
                      value={campaignForm.templateId}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, templateId: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a template...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Select Contacts ({campaignForm.selectedContacts.length} selected)</Label>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`contact-${contact.id}`}
                            checked={campaignForm.selectedContacts.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  selectedContacts: [...prev.selectedContacts, contact.id]
                                }))
                              } else {
                                setCampaignForm(prev => ({
                                  ...prev,
                                  selectedContacts: prev.selectedContacts.filter(id => id !== contact.id)
                                }))
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`contact-${contact.id}`} className="flex-1 text-sm">
                            <span className="font-medium">{contact.name}</span>
                            <span className="text-gray-500"> ({contact.email})</span>
                            <span className="text-blue-600"> - {contact.company}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {campaignForm.templateId && campaignForm.selectedContacts.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Campaign Preview</h4>
                      <p className="text-sm text-blue-800">
                        Template: <strong>{templates.find(t => t.id === campaignForm.templateId)?.name}</strong>
                      </p>
                      <p className="text-sm text-blue-800">
                        Recipients: <strong>{campaignForm.selectedContacts.length} contacts</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Each email will be personalized with the recipient's name and company.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={sendCampaign}
                      disabled={loading || !isEmailConnected || !campaignForm.name || !campaignForm.templateId || campaignForm.selectedContacts.length === 0}
                    >
                      {loading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : isEmailConnected ? (
                        "Create & Send Campaign"
                      ) : (
                        "Connect Email First"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {templates.length === 0 || contacts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to create campaigns?</h3>
                <p className="text-gray-600 mb-4">
                  You need at least one template and one contact to create a campaign
                </p>
                <div className="space-y-2">
                  {templates.length === 0 && (
                    <p className="text-sm text-red-600">• Create an email template first</p>
                  )}
                  {contacts.length === 0 && (
                    <p className="text-sm text-red-600">• Add some contacts to your list</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Mail className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to launch campaigns!</h3>
                <p className="text-gray-600 mb-4">
                  You have {templates.length} template{templates.length !== 1 ? 's' : ''} and {contacts.length} contact{contacts.length !== 1 ? 's' : ''} ready
                </p>
                <Button onClick={() => setShowCampaignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
