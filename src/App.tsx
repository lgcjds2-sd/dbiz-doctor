import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { CompanyRegister } from '@/pages/CompanyRegister'
import { CompanyHistory } from '@/pages/CompanyHistory'
import { Diagnosis } from '@/pages/Diagnosis'
import { ResultsDashboard } from '@/pages/ResultsDashboard'
import { AssessmentList } from '@/pages/AssessmentList'
import { DeepDive } from '@/pages/stages/DeepDive'
import { CausalLoop } from '@/pages/stages/CausalLoop'
import { LeveragePoints } from '@/pages/stages/LeveragePoints'
import { ActionPlanPage } from '@/pages/stages/ActionPlanPage'
import { Report } from '@/pages/stages/Report'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminCategories } from '@/pages/admin/AdminCategories'
import { AdminQuestions } from '@/pages/admin/AdminQuestions'
import { AdminCompanies } from '@/pages/admin/AdminCompanies'
import { AdminResults } from '@/pages/admin/AdminResults'
import { AdminReports } from '@/pages/admin/AdminReports'
import { AdminAIAnalysis } from '@/pages/admin/AdminAIAnalysis'
import { AdminCausalRelationships } from '@/pages/admin/AdminCausalRelationships'
import { AdminConsultantProfile } from '@/pages/admin/AdminConsultantProfile'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-100">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/companies/new"
            element={
              <ProtectedRoute>
                <CompanyRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <ProtectedRoute>
                <AssessmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies/:companyId/history"
            element={
              <ProtectedRoute>
                <CompanyHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/survey"
            element={
              <ProtectedRoute>
                <Diagnosis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/results"
            element={
              <ProtectedRoute>
                <ResultsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/deep-dive"
            element={
              <ProtectedRoute>
                <DeepDive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/causal-loop"
            element={
              <ProtectedRoute>
                <CausalLoop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/leverage-points"
            element={
              <ProtectedRoute>
                <LeveragePoints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/action-plan"
            element={
              <ProtectedRoute>
                <ActionPlanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessments/:assessmentId/report"
            element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="questions" element={<AdminQuestions />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="ai-analysis" element={<AdminAIAnalysis />} />
            <Route path="causal-relationships" element={<AdminCausalRelationships />} />
            <Route path="consultant-profile" element={<AdminConsultantProfile />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
