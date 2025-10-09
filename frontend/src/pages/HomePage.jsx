import  { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNavigation } from "../Components/layout/BottomNavigation";
import { AddItemForm } from '../Components/forms/AddItemForm';
import { WorkPage } from './WorkPage';
import { RestaurantsPage } from './RestaurantsPage';
import { ProductsPage } from './ProductsPage';
import { ProfilePage } from './ProfilePage';

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
        // First tab shows Food (Restaurants)
        return <RestaurantsPage />;
      case 1:
        // Second tab shows Home (WorkPage)
        return <WorkPage />;
      case 3:
        // Fourth tab shows Products
        return <ProductsPage />;
      case 4:
        // Fifth tab shows Profile
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