import { useState } from "react";
import Header from "@/components/layout/header";
import NewLoanModal from "@/components/modals/new-loan-modal";

export default function NewApplication() {
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    // Redirect to dashboard after modal closes
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <>
      <Header 
        title="New Application" 
        subtitle="Create a new loan application"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="text-center py-12">
          <p className="text-text-secondary mb-4">
            Fill out the application form to get started.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Open Application Form
          </button>
        </div>
      </main>

      <NewLoanModal 
        open={showModal} 
        onClose={handleClose} 
      />
    </>
  );
}
