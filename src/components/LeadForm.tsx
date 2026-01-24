import React, { useState } from 'react';
import { Lead, LeadType, LeadSource, ServiceType, LEAD_TYPES, LEAD_SOURCES, SERVICES } from '../types/Lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (lead: Omit<Lead, 'id' | 'status' | 'comments' | 'reminders' | 'createdAt'>) => void;
  onCancel: () => void;
  inline?: boolean;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit, onCancel, inline = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    email: '',
    city: '',
    leadType: 'warm' as LeadType,
    source: 'google_ads' as LeadSource,
    service: 'website' as ServiceType,
    notes: '',
    assignmentHistory: [] as any[],
    teamThread: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={inline ? 'lead-form-inline' : ''}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="number">Phone Number *</label>
              <input
                type="tel"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="leadType">Lead Type *</label>
              <select
                id="leadType"
                name="leadType"
                value={formData.leadType}
                onChange={handleChange}
                required
              >
                {LEAD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="source">Source *</label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
              >
                {LEAD_SOURCES.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="service">Service *</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
            >
              {SERVICES.map(service => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional information about the lead..."
            />
          </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          Add Lead
        </button>
      </div>
    </form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <div className="lead-form-overlay">
      <div className="lead-form">
        <h2>Add New Lead</h2>
        {formContent}
      </div>
    </div>
  );
};

export default LeadForm;
