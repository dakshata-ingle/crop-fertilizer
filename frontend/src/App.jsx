import { Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import FertilizerCalculator from './components/FertilizerCalculator'
import Header from './components/Header'
import { Analytics } from "@vercel/analytics/react"
import AboutUs from './components/About'
import { useEffect, useContext } from 'react'
import ContactUs from './components/ContactUs'
import Login from './components/Login'
import Signup from './components/Signup'
import AdminDashboard from './components/AdminDashboard'
import Clients from './components/Clients'
import ClientDetails from './components/ClientDetails'
import ClientAdmins from './components/ClientAdmins'
import ClientAdminDetails from './components/ClientAdminDetails'
import ClientAdminFertilizers from './components/ClientAdminFertilizers'
import ClientAdminCrops from './components/ClientAdminCrops'
import ClientAdminCropVarieties from './components/ClientAdminCropVarieties'
import ClientAdminCropVarietyForm from './components/ClientAdminCropVarietyForm'
import ClientAdminGrowthStages from './components/ClientAdminGrowthStages'
import ClientAdminGrowthStageForm from './components/ClientAdminGrowthStageForm'
import ClientAdminDashboard from './components/ClientAdminDashboard'
import CropApprovalQueue from './components/CropApprovalQueue'
import FertilizerApprovalQueue from './components/FertilizerApprovalQueue'
import FarmerDashboard from './components/FarmerDashboard'
import RecommendationHistory from './components/RecommendationHistory'
import SuperAdminFertilizers from './components/SuperAdminFertilizers'
import SuperAdminFertilizerView from './components/SuperAdminFertilizerView'
import SuperAdminFertilizerPriceHistory from './components/SuperAdminFertilizerPriceHistory'
import SuperAdminFertilizerChangeHistory from './components/SuperAdminFertilizerChangeHistory'
import SuperAdminCropVarietyApproval from './components/SuperAdminCropVarietyApproval'
import SuperAdminGrowthStageApproval from './components/SuperAdminGrowthStageApproval'
import SuperAdminCrops from './components/SuperAdminCrops'
import { AuthProvider, AuthContext } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

function Home() {
  return <Navigate to="/login" replace />
}

const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !/^#([0-9a-f]{6})$/i.test(hex)) {
    return `rgba(57, 181, 74, ${alpha})`;
  }

  const normalizedHex = hex.replace('#', '');
  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

function AppShell() {
  const { clientBranding } = useContext(AuthContext);

  const shellStyle = {
    backgroundImage: `linear-gradient(180deg, ${hexToRgba(clientBranding.primaryColor, 0.12)} 0%, rgba(255, 255, 255, 0) 220px), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)`,
  };

  return (
    <div className='min-h-screen relative' style={shellStyle}>
      <Header />
      <div className='lg:container mx-auto'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route
            path='/calculator'
            element={<ProtectedRoute allowedRoles={['farmer']}><FertilizerCalculator /></ProtectedRoute>}
          />
          <Route
            path='/farmer'
            element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>}
          />
          <Route
            path='/farmer/history'
            element={<ProtectedRoute allowedRoles={['farmer']}><RecommendationHistory /></ProtectedRoute>}
          />
          <Route
            path='/farmer/approved-crops'
            element={<ProtectedRoute allowedRoles={['farmer']}><Navigate to='/farmer#approved-crops' replace /></ProtectedRoute>}
          />
          <Route
            path='/farmer/approved-fertilizers'
            element={<ProtectedRoute allowedRoles={['farmer']}><Navigate to='/farmer#approved-fertilizers' replace /></ProtectedRoute>}
          />
          <Route
            path='/admin'
            element={<ProtectedRoute allowedRoles={['super_admin']}><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path='/admin/clients'
            element={<ProtectedRoute allowedRoles={['super_admin']}><Clients /></ProtectedRoute>}
          />
          <Route
            path='/admin/clients/:id'
            element={<ProtectedRoute allowedRoles={['super_admin']}><ClientDetails /></ProtectedRoute>}
          />
          <Route
            path='/admin/client-admins'
            element={<ProtectedRoute allowedRoles={['super_admin']}><ClientAdmins /></ProtectedRoute>}
          />
          <Route
            path='/admin/client-admins/:id'
            element={<ProtectedRoute allowedRoles={['super_admin']}><ClientAdminDetails /></ProtectedRoute>}
          />
          <Route
            path='/admin/crops/pending'
            element={<ProtectedRoute allowedRoles={['super_admin']}><CropApprovalQueue /></ProtectedRoute>}
          />
          <Route
            path='/admin/crops'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminCrops /></ProtectedRoute>}
          />
          <Route
            path='/admin/crop-varieties/pending'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminCropVarietyApproval /></ProtectedRoute>}
          />
          <Route
            path='/admin/growth-stages/pending'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminGrowthStageApproval /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers/pending'
            element={<ProtectedRoute allowedRoles={['super_admin']}><FertilizerApprovalQueue /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminFertilizers /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers/view'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminFertilizers /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers/view/:id'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminFertilizerView /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers/history/:id'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminFertilizerPriceHistory /></ProtectedRoute>}
          />
          <Route
            path='/admin/fertilizers/changes/:id'
            element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminFertilizerChangeHistory /></ProtectedRoute>}
          />
          <Route
            path='/client-admin'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminDashboard /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/crops'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminCrops /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/crop-varieties'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminCropVarieties /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/crop-varieties/new'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminCropVarietyForm /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/crop-varieties/:id'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminCropVarietyForm /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/growth-stages'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminGrowthStages /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/growth-stages/new'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminGrowthStageForm /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/growth-stages/:id'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminGrowthStageForm /></ProtectedRoute>}
          />
          <Route
            path='/client-admin/fertilizers'
            element={<ProtectedRoute allowedRoles={['client_admin']}><ClientAdminFertilizers /></ProtectedRoute>}
          />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </div>

      <Analytics />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
