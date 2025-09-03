import  { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from "../Components/layout/BottomNavigation";
import { AddItemForm } from '../Components/forms/AddItemForm';
import { WorkPage } from './WorkPage';
import { RestaurantsPage } from './RestaurantsPage';
import { ProductsPage } from './ProductsPage';
import { ProfilePage } from './ProfilePage';
import { MaintenancePage } from "../Components/MaintenancePage";

export const HomePage = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(() => {
    // If coming from navigation with state, use that
    if (location.state && typeof location.state.activeIndex === 'number') {
      return location.state.activeIndex;
    }
    return 0; // Default to first tab (Work)
  });
  const [showForm, setShowForm] = useState(false);

  const renderCurrentPage = () => {
    switch(activeIndex) {
      case 0:
        // First tab now shows Food (Restaurants)
        return <RestaurantsPage />;
      case 1:
        // Second tab now shows Home (under maintenance)
        return <MaintenancePage pageName="Home" />;
      case 3:
        return <MaintenancePage pageName="Products" />;
      case 4:
        return <ProfilePage />;
      default:
        return <RestaurantsPage />;
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    // Optionally refresh the current page data
  };

  return (
    <div className="min-h-screen bg-black">
      {showForm ? (
        <AddItemForm 
          onCancel={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      ) : (
        <>
          <div className="pb-20">
            {renderCurrentPage()}
          </div>
          <BottomNavigation 
            activeIndex={activeIndex}
            onNavigate={setActiveIndex}
            onShowForm={() => setShowForm(true)}
          />
        </>
      )}
    </div>
  );
};