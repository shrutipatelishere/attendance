import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '../types/Lead';
import { createLead } from '../utils/storage';
import { useUser } from '../context/UserContext';
import LeadForm from '../components/LeadForm';
import './AddLeadPage.css';

const AddLeadPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const handleAddLead = async (leadData: Omit<Lead, 'id' | 'status' | 'comments' | 'reminders' | 'createdAt'>) => {
    try {
      const newLead: Lead = {
        ...leadData,
        id: Date.now().toString(),
        status: 'new',
        comments: [],
        reminders: [],
        createdAt: new Date(),
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        assignedTo: currentUser?.id,
        assignedToName: currentUser?.name,
      };

      await createLead(newLead);
      navigate('/leads');
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  return (
    <div className="add-lead-page">
      <div className="page-header">
        <h1>Add New Lead</h1>
        <p className="subtitle">Fill in the details to create a new lead</p>
      </div>

      <div className="form-container">
        <LeadForm
          onSubmit={handleAddLead}
          onCancel={() => navigate('/leads')}
          inline={true}
        />
      </div>
    </div>
  );
};

export default AddLeadPage;
