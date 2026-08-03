import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Classes from './pages/Classes'
import Teachers from './pages/Teachers'
import Attendance from './pages/Attendance'
import Evaluation from './pages/Evaluation'
import Nipun from './pages/Nipun'
import LearningOutcomes from './pages/LearningOutcomes'
import Grades from './pages/Grades'
import Settings from './pages/Settings'
import SchoolInfo from './pages/SchoolInfo'
import CasteWise from './pages/CasteWise'
import Account from './pages/Account'
import WorkingDays from './pages/WorkingDays'
import Bharansh from './pages/Bharansh'
import Promote from './pages/Promote'
import IdCard from './pages/IdCard'
import Bonafide from './pages/Bonafide'
import TransferCertificate from './pages/TransferCertificate'
import Backup from './pages/Backup'
import DataEntry from './pages/DataEntry'
import Records from './pages/Records'
import Results from './pages/Results'
import StudentExtra from './pages/StudentExtra'
import Scholarships from './pages/Scholarships'
import GeneralRegister from './pages/GeneralRegister'
import ReportCard from './pages/ReportCard'
import SemesterReport from './pages/SemesterReport'

export default function App() {
  const { auth, loading } = useAuth()

  if (loading) return <div className="p-8 text-slate-500">लोड होत आहे…</div>

  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/data-entry" element={<DataEntry />} />
        <Route path="/records" element={<Records />} />
        <Route path="/results" element={<Results />} />
        <Route path="/student-extra" element={<StudentExtra />} />
        <Route path="/school" element={<SchoolInfo />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/evaluation" element={<Evaluation />} />
        <Route path="/nipun" element={<Nipun />} />
        <Route path="/learning-outcomes" element={<LearningOutcomes />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/semester-report" element={<SemesterReport />} />
        <Route path="/report-card" element={<ReportCard />} />
        <Route path="/scholarships" element={<Scholarships />} />
        <Route path="/general-register" element={<GeneralRegister />} />
        <Route path="/caste-wise" element={<CasteWise />} />
        <Route path="/working-days" element={<WorkingDays />} />
        <Route path="/bharansh" element={<Bharansh />} />
        <Route path="/promote" element={<Promote />} />
        <Route path="/id-card" element={<IdCard />} />
        <Route path="/bonafide" element={<Bonafide />} />
        <Route path="/tc" element={<TransferCertificate />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
