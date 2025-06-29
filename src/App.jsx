import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    getDocs,
    setDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy,
    limit,
    Timestamp,
    where
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL 
} from 'firebase/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import * as XLSX from 'xlsx'; // New library for Excel export
import { 
    Home, DollarSign, Calendar, BarChart2 as ReportIcon, Settings, User, LogOut, 
    Plus, Trash2, FileText, X, Menu, Users, History, AlertTriangle, KeyRound, 
    UserPlus, ChevronLeft, ChevronRight, UploadCloud, CheckCircle, Eye, EyeOff, 
    Edit, Image as ImageIcon, Search, Download, FileSpreadsheet
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDLP8ZGO0YtzGH17gp60d0M1yyoV-UVVrs",
  authDomain: "blackoffice-jimiko.firebaseapp.com",
  databaseURL: "https://blackoffice-jimiko-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "blackoffice-jimiko",
  storageBucket: "blackoffice-jimiko.appspot.com",
  messagingSenderId: "881411328219",
  appId: "1:881411328219:web:5b0de32586ac66ae43a4fe",
  measurementId: "G-HKHFMC7K47"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Simple Obfuscation for Passwords ---
const encodePass = (str) => btoa(str);

// --- Helper Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount);
const formatFullDate = (date) => date ? new Date(date.seconds * 1000).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short'}) : 'N/A';
const formatShortDate = (date) => date ? new Date(date.seconds * 1000).toLocaleDateString('th-TH') : 'N/A';

const logAction = async (user, action, details = {}) => {
    try {
        if (!user) return;
        const logData = {
            action,
            userId: user.id,
            userDisplay: user.displayName,
            timestamp: Timestamp.now(),
            details: JSON.stringify(details, null, 2)
        };
        const logCollectionPath = `/artifacts/${appId}/public/data/logs`;
        await addDoc(collection(db, logCollectionPath), logData);
    } catch (error) { console.error("Error logging action:", error); }
};

const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

// --- Reusable Components ---
function Modal({ isOpen, onClose, children, title }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl w-full max-w-lg text-white animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-purple-400">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                </div>
                {children}
            </div>
        </div>
    );
}

// --- Main App Component ---
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const storedUser = sessionStorage.getItem('blackoffice_user');
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
        setIsLoading(false);
    }, []);
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleLoginSuccess = (userData) => {
        setCurrentUser(userData);
        sessionStorage.setItem('blackoffice_user', JSON.stringify(userData));
    };
    
    const handleProfileUpdate = (updatedData) => {
      const newUserData = { ...currentUser, ...updatedData };
      setCurrentUser(newUserData);
      sessionStorage.setItem('blackoffice_user', JSON.stringify(newUserData));
    }

    const handleLogout = () => {
        logAction(currentUser, 'logout');
        setCurrentUser(null);
        sessionStorage.removeItem('blackoffice_user');
        setCurrentPage('home');
    };
    
    const navigateTo = (page) => {
      setCurrentPage(page);
      setIsSidebarOpen(false);
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-purple-400"><div className="text-xl font-semibold animate-pulse">กำลังโหลด...</div></div>;
    if (!currentUser) return <AuthPage onLoginSuccess={handleLoginSuccess} />;

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {notification.show && (<div className={`fixed top-5 right-5 text-white py-2 px-4 rounded-lg shadow-2xl z-[100] ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{notification.message}</div>)}
            <Sidebar currentPage={currentPage} navigateTo={navigateTo} userRole={currentUser?.role} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}/>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header userData={currentUser} handleLogout={handleLogout} setIsSidebarOpen={setIsSidebarOpen}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <PageContent page={currentPage} user={currentUser} userData={currentUser} showNotification={showNotification} navigateTo={navigateTo} onProfileUpdate={handleProfileUpdate}/>
                </main>
            </div>
        </div>
    );
}

// --- Authentication Page ---
function AuthPage({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault(); setError(''); setIsLoading(true);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", username.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            const userDoc = querySnapshot.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() };
            if (userData.password === encodePass(password)) {
                onLoginSuccess(userData);
                await logAction(userData, 'login_success');
            } else { throw new Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"); }
        } catch (err) { setError(err.message); await logAction(null, 'login_failed', { username }); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-purple-900/20">
                <div className="text-center"><h2 className="text-3xl font-bold text-white">BlackOffice <span className="text-purple-400">Jimiko</span></h2><p className="text-gray-400 mt-2">โปรแกรมจัดการธุรกิจของคุณ</p></div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div><label className="text-sm font-bold text-gray-400 block mb-2">ชื่อผู้ใช้ (Username)</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" required /></div>
                    <div><label className="text-sm font-bold text-gray-400 block mb-2">รหัสผ่าน</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" required /></div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div><button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 disabled:bg-gray-500 disabled:shadow-none">{isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}</button></div>
                </form>
            </div>
        </div>
    );
}

// --- Layout Components ---
function Sidebar({ currentPage, navigateTo, userRole, isSidebarOpen, setIsSidebarOpen }) {
    const navItems = [
        { id: 'home', label: 'หน้าแรก', icon: Home, roles: ['staff', 'admin', 'owner'] },
        { id: 'finance', label: 'รายรับ-รายจ่าย', icon: DollarSign, roles: ['staff', 'admin', 'owner'] },
        { id: 'calendar', label: 'ปฏิทินงาน', icon: Calendar, roles: ['staff', 'admin', 'owner'] },
        { id: 'reports', label: 'รายงานการเงิน', icon: ReportIcon, roles: ['admin', 'owner'] },
        { id: 'all-finances', label: 'การเงินทั้งหมด', icon: FileSpreadsheet, roles: ['owner'] },
        { id: 'settings', label: 'ตั้งค่า', icon: Settings, roles: ['admin', 'owner'] },
        { id: 'profile', label: 'โปรไฟล์', icon: User, roles: ['staff', 'admin', 'owner'] },
        { id: 'logs', label: 'Log', icon: History, roles: ['owner'] },
    ];
    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <aside className={`bg-gray-800 border-r border-gray-700 text-gray-300 w-64 space-y-2 py-4 px-2 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
                <div className="px-4 pb-4 border-b border-gray-700 flex items-center justify-between"><h1 className="text-xl font-bold text-white">Black<span className="text-purple-400">Office</span></h1><button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white md:hidden"><X className="w-6 h-6" /></button></div>
                <nav className="flex-grow pt-4">{userRole && navItems.filter(item => item.roles.includes(userRole)).map(item => (<a key={item.id} href="#" onClick={(e) => { e.preventDefault(); navigateTo(item.id); }} className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 mb-1 ${currentPage === item.id ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-gray-700 hover:text-white'}`}><item.icon className="w-5 h-5 mr-3" /><span className="font-semibold">{item.label}</span></a>))}</nav>
            </aside>
        </>
    );
}

function Header({ userData, handleLogout, setIsSidebarOpen }) {
    return (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center z-20 sticky top-0">
             <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 focus:outline-none"><Menu className="h-6 w-6" /></button>
            <div className="flex items-center space-x-4">
                <div className="text-right"><p className="font-semibold text-white">{userData?.displayName || userData?.username}</p><p className="text-sm text-purple-400 capitalize font-medium">{userData?.role}</p></div>
                 <img className="h-11 w-11 rounded-full object-cover border-2 border-purple-500" src={userData?.photoURL || `https://placehold.co/44x44/1F2937/A78BFA?text=${(userData?.displayName || 'U').charAt(0).toUpperCase()}`} alt="โปรไฟล์"/>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="ออกจากระบบ"><LogOut className="w-6 h-6" /></button>
            </div>
        </header>
    );
}

function PageContent({ page, user, userData, showNotification, navigateTo, onProfileUpdate }) {
    switch (page) {
        case 'home': return <HomePage navigateTo={navigateTo}/>;
        case 'finance': return <FinancePage user={user} userData={userData}/>;
        case 'calendar': return <CalendarPage user={user} showNotification={showNotification}/>;
        case 'reports': return <ReportsPage user={user} userData={userData} />;
        case 'all-finances': return <AllFinancesPage user={user} userData={userData} />;
        case 'settings': return <SettingsPage user={user} userData={userData} showNotification={showNotification} />;
        case 'profile': return <ProfilePage user={user} userData={userData} showNotification={showNotification} onProfileUpdate={onProfileUpdate} />;
        case 'logs': return <LogsPage />;
        default: return <div className="text-center text-gray-500">Page not found</div>;
    }
}

// --- Page Components ---

function HomePage({navigateTo}) {
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [latestTx, setLatestTx] = useState([]);
    
    useEffect(() => {
        const finPath = `/artifacts/${appId}/public/data/finances`;
        const eventsPath = `/artifacts/${appId}/public/data/events`;
        const unsubFin = onSnapshot(collection(db, finPath), (snapshot) => {
            let totalIncome = 0, totalExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.type === 'income') totalIncome += data.amount; else totalExpense += data.amount;
            });
            setSummary(prev => ({ ...prev, income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense }));
        });
        const qTx = query(collection(db, finPath), orderBy('createdAt', 'desc'), limit(3));
        const unsubLatestTx = onSnapshot(qTx, (snapshot) => setLatestTx(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const qEvents = query(collection(db, eventsPath), where('date', '>=', Timestamp.fromDate(startOfToday)), orderBy('date'));
        const unsubEvents = onSnapshot(qEvents, (snapshot) => setUpcomingEvents(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => { unsubFin(); unsubEvents(); unsubLatestTx(); };
    }, []);

    const SummaryCard = ({ title, value, icon, color, page }) => (
        <div onClick={() => navigateTo(page)} className={`bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:border-${color}-500 hover:shadow-${color}-500/20 transition-all duration-300 cursor-pointer group`}>
            <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-400 font-medium">{title}</p><p className="text-3xl font-bold text-white mt-1">{value}</p></div>
                <div className={`p-3 rounded-full bg-${color}-600/20 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>{icon}</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">หน้าแรก</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SummaryCard title="รายรับทั้งหมด" value={formatCurrency(summary.income)} icon={<DollarSign/>} color="green" page="reports" />
                <SummaryCard title="รายจ่ายทั้งหมด" value={formatCurrency(summary.expense)} icon={<DollarSign/>} color="red" page="reports" />
                <SummaryCard title="คงเหลือทั้งหมด" value={formatCurrency(summary.balance)} icon={<DollarSign/>} color="purple" page="reports" />
                <SummaryCard title="กิจกรรมในอนาคต" value={`${upcomingEvents.length} รายการ`} icon={<Calendar/>} color="blue" page="calendar" />
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">รายการล่าสุด</h3>
                <div className="space-y-4">
                    {latestTx.length > 0 ? latestTx.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-center"><div className={`w-3 h-3 rounded-full mr-4 ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div><div><p className="font-semibold text-white">{t.description || "ไม่มีรายละเอียด"}</p><p className="text-sm text-gray-400">{t.category} • {formatFullDate(t.createdAt)}</p></div></div>
                            <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</p>
                        </div>
                    )) : (<p className="text-gray-500 text-center py-8">ยังไม่มีรายการ...</p>)}
                </div>
            </div>
        </div>
    );
}

function FinancePage({ user, userData }) {
    const [transactions, setTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
        const q = query(collection(db, financeCollectionPath), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsub;
    }, []);

    const handleDelete = async (id) => {
        const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
        await deleteDoc(doc(db, financeCollectionPath, id));
        await logAction(user, 'delete_transaction', { transactionId: id });
    };

    return (
        <div className="relative min-h-full">
            <h2 className="text-3xl font-bold text-white mb-6">รายรับ-รายจ่าย</h2>
            <div className="space-y-3 pb-24">
                 {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center justify-between gap-4 transition hover:border-purple-500">
                        <div className="flex items-center flex-1 min-w-0"><div className={`p-3 rounded-full mr-4 flex-shrink-0 ${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}><DollarSign size={20}/></div><div className="flex-1 min-w-0"><p className="font-semibold text-white truncate">{t.description || "ไม่มีรายละเอียด"}</p><p className="text-sm text-gray-400">{t.category}</p><p className="text-xs text-gray-500 mt-1">บันทึกเมื่อ: {formatFullDate(t.createdAt)}</p></div></div>
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0"><p className={`font-bold text-lg sm:text-xl text-right ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</p><div className="flex items-center">{t.fileURL && <a href={t.fileURL} target="_blank" rel="noopener noreferrer" className="p-1 text-purple-400 hover:text-purple-300"><FileText/></a>}{userData.role !== 'staff' && (<button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={18}/></button>)}</div></div>
                    </div>
                 )) : (<div className="text-center py-20"><p className="text-gray-500">ยังไม่มีรายการ...</p><p className="text-gray-600">กดปุ่ม + เพื่อเพิ่มรายการแรกของคุณ</p></div>)}
            </div>
            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-purple-600/40 transition-transform hover:scale-110" title="เพิ่มรายการใหม่"><Plus size={32}/></button>
            <FinanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user}/>
        </div>
    );
}

function FinanceModal({ isOpen, onClose, user }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        if (!isOpen) return;
        setType('expense'); setAmount(''); setDescription(''); setFile(null); setError('');
        const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;
        const q = query(collection(db, categoriesCollectionPath));
        const unsub = onSnapshot(q, (snapshot) => {
            const catData = snapshot.docs.map(doc => doc.data().name);
            setCategories(catData);
            if (catData.length > 0) setCategory(catData[0]);
        });
        return unsub;
    }, [isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) { setError('ไฟล์ต้องเป็น JPG, PNG, หรือ PDF เท่านั้น'); return; }
            if (selectedFile.size > 5 * 1024 * 1024) { setError('ขนาดไฟล์ต้องไม่เกิน 5MB'); return; }
            setError(''); setFile(selectedFile);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!amount || !category) { setError("กรุณากรอกจำนวนเงินและเลือกหมวดหมู่"); return; }
        setUploading(true); setError('');

        let fileURL = '';
        if (file) {
            const storageRef = ref(storage, `attachments/${user.id}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            try {
                await uploadTask;
                fileURL = await getDownloadURL(uploadTask.snapshot.ref);
            } catch (err) { setError('อัปโหลดไฟล์ล้มเหลว'); setUploading(false); return; }
        }

        const transactionData = { type, amount: parseFloat(amount), category, description, userId: user.id, fileURL, createdAt: Timestamp.now() };

        try {
            const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
            const docRef = await addDoc(collection(db, financeCollectionPath), transactionData);
            await logAction(user, 'create_transaction', { ...transactionData, transactionId: docRef.id });
            onClose();
        } catch (err) { setError('บันทึกข้อมูลล้มเหลว'); } 
        finally { setUploading(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="เพิ่มรายการใหม่">
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setType('income')} className={`py-3 rounded-lg font-bold transition-colors ${type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>รายรับ</button><button type="button" onClick={() => setType('expense')} className={`py-3 rounded-lg font-bold transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>รายจ่าย</button></div>
                <div><label className="text-sm font-medium text-gray-400">จำนวนเงิน</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"/></div>
                 <div><label className="text-sm font-medium text-gray-400">หมวดหมู่</label><select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="text-sm font-medium text-gray-400">รายละเอียด</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"></textarea></div>
                <div><label className="text-sm font-medium text-gray-400">ไฟล์แนบ (ถ้ามี)</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md"><div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-500" /><div className="flex text-sm text-gray-400"><label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 px-2"><span>อัปโหลดไฟล์</span><input id="file-upload" name="file-upload" type="file" onChange={handleFileChange} className="sr-only"/></label><p className="pl-1">หรือลากมาวาง</p></div><p className="text-xs text-gray-500">PNG, JPG, PDF ไม่เกิน 5MB</p></div></div>{file && <p className="text-sm text-green-400 mt-2 text-center">{file.name}</p>}</div>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                <div className="pt-2"><button type="submit" disabled={uploading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 disabled:bg-gray-500 disabled:shadow-none">{uploading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</button></div>
            </form>
        </Modal>
    );
}

function CalendarPage({ user, showNotification }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isDayModalOpen, setIsDayModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const eventsCollectionPath = `/artifacts/${appId}/public/data/events`;

    const upcomingEvents = useMemo(() => {
      const now = new Date();
      return events
        .filter(e => e.date.toDate() >= now)
        .sort((a, b) => a.date.seconds - b.date.seconds);
    }, [events]);

    useEffect(() => {
        const q = query(collection(db, eventsCollectionPath), orderBy('date'));
        const unsub = onSnapshot(q, (snapshot) => setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsub;
    }, []);
    
    const handleDayClick = (date) => {
        setSelectedDate(date);
        setIsDayModalOpen(true);
    };
    
    const changeMonth = (offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const calendarDays = [...Array(firstDayIndex).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];

    return(
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white leading-tight">ปฏิทินงาน</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronLeft/></button>
                    <span className="text-xl font-semibold text-purple-400 w-48 text-center">
                        {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronRight/></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => <div key={day} className="text-center font-semibold text-gray-400 py-2 text-xs sm:text-base">{day}</div>)}
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`}></div>;
                    
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const monthEvents = events.filter(e => {
                        const eventDate = e.date.toDate();
                        return eventDate.getFullYear() === date.getFullYear() &&
                               eventDate.getMonth() === date.getMonth() &&
                               eventDate.getDate() === date.getDate();
                    });
                    
                    return (
                        <div key={day} onClick={() => handleDayClick(date)} className="bg-gray-800 rounded-lg aspect-square p-2 flex flex-col relative group cursor-pointer border-2 border-transparent hover:border-purple-500 transition-colors duration-300">
                            <time dateTime={date.toISOString()} className={`font-bold text-sm sm:text-base ${isToday ? 'bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-300'}`}>
                                {day}
                            </time>
                            <div className="flex-grow overflow-y-auto mt-1 space-y-1 no-scrollbar">
                                {monthEvents.slice(0, 2).map(event => (
                                    <div key={event.id} className="bg-purple-900/70 p-1.5 rounded-md text-xs text-white truncate">{event.title}</div>
                                ))}
                                {monthEvents.length > 2 && <div className="text-xs text-gray-500 mt-1">...</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {selectedDate && <DayDetailModal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} user={user} date={selectedDate} showNotification={showNotification}/>}

             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 mt-8">
                <h3 className="text-xl font-bold text-white mb-4">กิจกรรมที่จะถึง</h3>
                <div className="space-y-3">
                    {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                        <div key={event.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-purple-300">{event.title}</p>
                                <p className="text-sm text-gray-400">{formatFullDate(event.date)}</p>
                            </div>
                            {event.imageURL && <img src={event.imageURL} alt={event.title} className="w-12 h-12 object-cover rounded-md"/>}
                        </div>
                    )) : <p className="text-center text-gray-500 py-4">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>}
                </div>
            </div>
        </div>
    );
}

function DayDetailModal({ isOpen, onClose, user, date, showNotification }) {
    const [events, setEvents] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    useEffect(() => {
        if (!date) return;
        const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
        
        const eventsCollectionPath = `/artifacts/${appId}/public/data/events`;
        const q = query(collection(db, eventsCollectionPath), where('date', '>=', startOfDay), where('date', '<=', endOfDay), orderBy('date'));
        const unsub = onSnapshot(q, (snapshot) => setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsub;
    }, [date, isOpen]);
    
    const handleDelete = async (eventId) => {
        await deleteDoc(doc(db, `/artifacts/${appId}/public/data/events`, eventId));
        showNotification("ลบกิจกรรมแล้ว", "success");
        await logAction(user, 'delete_event', { eventId });
    }

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`กิจกรรมวันที่ ${date?.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="bg-gray-700 p-3 rounded-lg flex items-start justify-between gap-4">
                      {event.imageURL && <img src={event.imageURL} alt={event.title} className="w-16 h-16 object-cover rounded-md"/>}
                      <div className="flex-grow">
                          <p className="font-bold text-purple-300">{event.title}</p>
                          <p className="text-sm text-gray-300">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">เวลา: {event.time || "ไม่ระบุ"}</p>
                      </div>
                      <button onClick={() => handleDelete(event.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0"><Trash2 size={18}/></button>
                  </div>
              )) : <p className="text-gray-500 text-center py-8">ไม่มีกิจกรรมในวันนี้</p>}
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold">เพิ่มกิจกรรมใหม่</button>
          {isAddModalOpen && <CalendarEventModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} user={user} eventDate={date} showNotification={showNotification}/>}
      </Modal>
    );
}

function CalendarEventModal({ isOpen, onClose, user, eventDate, showNotification }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('12:00');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    useEffect(() => { if(isOpen) { setTitle(''); setDescription(''); setFile(null); setTime('12:00'); } }, [isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) setFile(selectedFile);
        else showNotification("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!title) return;
        setUploading(true);
        
        const [hours, minutes] = time.split(':');
        const finalDate = new Date(eventDate);
        finalDate.setHours(parseInt(hours), parseInt(minutes));

        let imageURL = '';
        if (file) {
            const storageRef = ref(storage, `event-images/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            try {
                await uploadTask;
                imageURL = await getDownloadURL(uploadTask.snapshot.ref);
            } catch (err) { setUploading(false); showNotification("อัปโหลดรูปภาพล้มเหลว", "error"); return; }
        }

        const eventData = { title, description, date: Timestamp.fromDate(finalDate), time, imageURL, createdBy: user.id, createdAt: Timestamp.now() };

        try {
            const docRef = await addDoc(collection(db, `/artifacts/${appId}/public/data/events`), eventData);
            await logAction(user, 'create_event', { eventId: docRef.id, title });
            showNotification("สร้างกิจกรรมสำเร็จ!", "success");
            onClose();
        } catch (err) { showNotification("สร้างกิจกรรมล้มเหลว", "error"); } 
        finally { setUploading(false); }
    };

    return(
        <Modal isOpen={isOpen} onClose={onClose} title={`สร้างกิจกรรมสำหรับวันที่ ${eventDate?.toLocaleDateString('th-TH')}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="ชื่องาน" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                <textarea placeholder="รายละเอียด..." value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"></textarea>
                <div>
                     <label className="text-sm font-medium text-gray-400">เวลาเริ่มกิจกรรม</label>
                     <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full mt-1 p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                </div>
                <div>
                     <label className="text-sm font-medium text-gray-400">แนบรูปภาพ</label>
                     <div className="mt-1 flex items-center justify-center w-full">
                        <label htmlFor="event-image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700">
                           {file ? <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-contain p-2" /> : (<div className="flex flex-col items-center justify-center pt-5 pb-6"><ImageIcon className="w-8 h-8 mb-2 text-gray-500" /><p className="text-sm text-gray-400">คลิกเพื่ออัปโหลด</p></div>)}
                           <input id="event-image-upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden"/>
                        </label>
                    </div>
                </div>
                <button type="submit" disabled={uploading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">
                    {uploading ? "กำลังสร้าง..." : "สร้างกิจกรรม"}
                </button>
            </form>
        </Modal>
    );
}

function ReportsPage({ user, userData }) {
    const [transactions, setTransactions] = useState([]);
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
        return { start, end };
    });
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        const finPath = `/artifacts/${appId}/public/data/finances`;
        const q = query(collection(db, finPath));
        const unsub = onSnapshot(q, (snapshot) => setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsub;
    }, []);

    const filteredData = useMemo(() => {
        const start = isCustomRange ? new Date(dateRange.start) : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = isCustomRange ? new Date(dateRange.end) : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        return transactions.filter(t => { const tDate = t.createdAt.toDate(); return tDate >= start && tDate <= end; });
    }, [transactions, currentMonth, isCustomRange, dateRange]);
    
    const dailySummary = useMemo(() => {
        const summary = {};
        filteredData.forEach(t => {
            const day = t.createdAt.toDate().getDate();
            if (!summary[day]) summary[day] = { income: 0, expense: 0 };
            if (t.type === 'income') summary[day].income += t.amount;
            else summary[day].expense += t.amount;
        });
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const chartData = [];
        for (let i = 1; i <= daysInMonth; i++) {
            chartData.push({ name: i, รายรับ: summary[i]?.income || 0, รายจ่าย: summary[i]?.expense || 0, });
        }
        return chartData;
    }, [filteredData, currentMonth]);

    const changeMonth = (offset) => {
        setIsCustomRange(false);
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white leading-tight">รายงานการเงิน</h2>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronLeft/></button>
                    <span className="text-xl font-semibold text-purple-400 w-48 text-center">{isCustomRange ? "กำหนดเอง" : currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronRight/></button>
                </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">กราฟสรุปประจำวัน</h3>
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailySummary} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                            <YAxis tickFormatter={(value) => `${value/1000}k`} tick={{ fill: '#9ca3af' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} formatter={(value) => formatCurrency(value)} />
                            <Legend wrapperStyle={{ color: '#e5e7eb' }}/>
                            <Bar dataKey="รายรับ" fill="#34d399" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="รายจ่าย" fill="#f87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// **NEW** All Finances Page
function AllFinancesPage({ user, userData }) {
    const [transactions, setTransactions] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);

    useEffect(() => {
        const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
        const q = query(collection(db, financeCollectionPath), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            const allTx = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setTransactions(allTx);
            const uniqueYears = [...new Set(allTx.map(tx => tx.createdAt.toDate().getFullYear()))];
            setYears(uniqueYears);
        });
        return unsub;
    }, []);

    const monthlySummary = useMemo(() => {
        const yearData = transactions.filter(tx => tx.createdAt.toDate().getFullYear() === selectedYear);
        const summary = Array.from({length: 12}, (_, i) => ({month: i, income: 0, expense: 0}));
        yearData.forEach(tx => {
            const month = tx.createdAt.toDate().getMonth();
            if (tx.type === 'income') summary[month].income += tx.amount;
            else summary[month].expense += tx.amount;
        });
        return summary.map((m, i) => ({...m, name: new Date(selectedYear, i).toLocaleDateString('th-TH', {month: 'short'})}));
    }, [transactions, selectedYear]);
    
    const handleExport = () => {
        const dataToExport = transactions.filter(tx => tx.createdAt.toDate().getFullYear() === selectedYear)
        .map(tx => ({
            'วันที่': formatFullDate(tx.createdAt),
            'ประเภท': tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
            'หมวดหมู่': tx.category,
            'รายละเอียด': tx.description,
            'จำนวนเงิน': tx.amount,
            'ไฟล์': tx.fileURL,
        }));
        exportToExcel(dataToExport, `financial_summary_${selectedYear}`);
        logAction(user, 'export_yearly_excel', { year: selectedYear });
    }

    if (userData.role !== 'owner') return <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white">การเงินทั้งหมด</h2>
                <div className="flex items-center gap-4">
                     <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="p-2 bg-gray-700 border border-gray-600 rounded-md">
                        {years.map(y => <option key={y} value={y}>ปี {y+543}</option>)}
                    </select>
                    <button onClick={handleExport} className="flex items-center bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700">
                        <Download className="mr-2" size={18}/> Export to Excel
                    </button>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">สรุปรายเดือนของปี {selectedYear+543}</h3>
                 <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlySummary} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                            <YAxis tickFormatter={(value) => `${value/1000}k`} tick={{ fill: '#9ca3af' }}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }} formatter={(value) => formatCurrency(value)} />
                            <Legend wrapperStyle={{ color: '#e5e7eb' }}/>
                            <Bar dataKey="income" name="รายรับ" fill="#34d399" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="รายจ่าย" fill="#f87171" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>
        </div>
    )
}

function SettingsPage({ user, userData, showNotification }) {
    const [currentTab, setCurrentTab] = useState('categories');
    return (
        <div className="space-y-8">
             <h2 className="text-3xl font-bold text-white">ตั้งค่าระบบ</h2>
             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex border-b border-gray-700 mb-6">
                    <button onClick={() => setCurrentTab('categories')} className={`py-2 px-4 font-semibold transition-colors ${currentTab === 'categories' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}>จัดการหมวดหมู่</button>
                    {userData.role === 'owner' && (<button onClick={() => setCurrentTab('users')} className={`py-2 px-4 font-semibold transition-colors ${currentTab === 'users' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}>จัดการผู้ใช้งาน</button>)}
                </div>
                {currentTab === 'categories' && <CategorySettings user={user} />}
                {currentTab === 'users' && userData.role === 'owner' && <UserSettings owner={user} showNotification={showNotification} />}
             </div>
        </div>
    );
}

function CategorySettings({ user }) {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;
        const q = query(collection(db, categoriesCollectionPath), orderBy('name'));
        const unsub = onSnapshot(q, snapshot => setCategories(snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name}))));
        return unsub;
    }, []);

    const handleAddCategory = async () => {
        if (newCategoryName.trim() === '') return;
        const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;
        await addDoc(collection(db, categoriesCollectionPath), { name: newCategoryName.trim() });
        await logAction(user, 'create_category', { name: newCategoryName.trim() });
        setNewCategoryName('');
    };

    const handleDeleteCategory = async (id) => {
        const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;
        await deleteDoc(doc(db, categoriesCollectionPath, id));
        await logAction(user, 'delete_category', { categoryId: id });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">หมวดหมู่รายรับ-รายจ่าย</h3>
            <div className="flex gap-2"><input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่" className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-white" /><button onClick={handleAddCategory} className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700">เพิ่ม</button></div>
            <div className="space-y-2">{categories.map(cat => (<div key={cat.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg"><span className="text-gray-200">{cat.name}</span><button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={18}/></button></div>))}</div>
        </div>
    );
}

function UserSettings({ owner, showNotification }) {
    const [users, setUsers] = useState([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy("username"));
        const unsub = onSnapshot(q, (snapshot) => setUsers(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return unsub;
    }, []);
    
    const handleEditClick = (user) => { setEditingUser(user); setIsEditModalOpen(true); }

    const handleDeleteUser = async (userId) => {
        if (owner.id === userId) { showNotification("ไม่สามารถลบข้อมูลตนเองได้", 'error'); return; }
        await deleteDoc(doc(db, 'users', userId));
        await logAction(owner, 'delete_user', { targetUserId: userId });
        showNotification("ลบผู้ใช้สำเร็จ", 'success');
    }

    return (
        <div className="space-y-4">
            {isAddUserModalOpen && <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} showNotification={showNotification} owner={owner} />}
            {isEditModalOpen && <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} showNotification={showNotification} owner={owner} userToEdit={editingUser} />}
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-white">รายชื่อผู้ใช้งาน</h3><button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700"><UserPlus className="mr-2"/>เพิ่มผู้ใช้ใหม่</button></div>
             <div className="overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-gray-700"><tr><th className="p-3">ชื่อผู้ใช้ / ชื่อจริง</th><th className="p-3">สิทธิ์</th><th className="p-3 text-center">จัดการ</th></tr></thead><tbody>{users.map(u => (<tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/50"><td className="p-3"><p className="font-semibold text-white">{u.username}</p><p className="text-sm text-gray-400">{u.displayName}</p></td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'owner' ? 'bg-purple-500/20 text-purple-400' : u.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.role}</span></td><td className="p-3 text-center space-x-2"><button onClick={() => handleEditClick(u)} className="p-2 text-gray-400 hover:text-blue-400" title="แก้ไขผู้ใช้"><Edit/></button><button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50" title="ลบผู้ใช้" disabled={owner.id === u.id || u.role === 'owner'}><Trash2/></button></td></tr>))}</tbody></table></div>
        </div>
    );
}

function AddUserModal({ isOpen, onClose, showNotification, owner }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('staff');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const handleCreateUser = async (e) => {
        e.preventDefault(); setIsLoading(true);
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const existingUser = await getDocs(q);
        if (!existingUser.empty) { showNotification("ชื่อผู้ใช้นี้มีอยู่แล้ว", 'error'); setIsLoading(false); return; }
        const newUser = { username: username.toLowerCase(), password: encodePass(password), displayName, role, photoURL: '', createdAt: Timestamp.now() };
        try {
            const docRef = await addDoc(collection(db, "users"), newUser);
            await logAction(owner, 'create_user', { newUserId: docRef.id, username });
            showNotification("สร้างผู้ใช้ใหม่สำเร็จ!", 'success');
            onClose();
        } catch(err) { showNotification("เกิดข้อผิดพลาด", 'error'); console.error(err); } 
        finally { setIsLoading(false); }
    };
    
    return (<Modal isOpen={isOpen} onClose={onClose} title="เพิ่มผู้ใช้ใหม่"><form onSubmit={handleCreateUser} className="space-y-4"><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="ชื่อผู้ใช้ (สำหรับล็อกอิน)" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ชื่อที่แสดง" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/><div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="รหัสผ่าน" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-gray-400">{showPassword ? <EyeOff/> : <Eye/>}</button></div><select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"><option value="staff">Staff</option><option value="admin">Admin</option></select><button type="submit" disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">{isLoading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}</button></form></Modal>);
}

function EditUserModal({ isOpen, onClose, showNotification, owner, userToEdit }) {
    const [newPassword, setNewPassword] = useState('');
    const [role, setRole] = useState(userToEdit.role);
    const [displayName, setDisplayName] = useState(userToEdit.displayName);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleUpdateUser = async (e) => {
        e.preventDefault(); setIsLoading(true);
        const updatedData = { displayName, role };
        if (newPassword) updatedData.password = encodePass(newPassword);
        try {
            await updateDoc(doc(db, "users", userToEdit.id), updatedData);
            await logAction(owner, 'update_user', { targetUserId: userToEdit.id, ...updatedData });
            showNotification("อัปเดตข้อมูลผู้ใช้สำเร็จ!", 'success');
            onClose();
        } catch(err) { showNotification("เกิดข้อผิดพลาด", 'error'); console.error(err); } 
        finally { setIsLoading(false); }
    };
    
    return (<Modal isOpen={isOpen} onClose={onClose} title={`แก้ไขผู้ใช้: ${userToEdit.username}`}><form onSubmit={handleUpdateUser} className="space-y-4"><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ชื่อที่แสดง" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/><select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg" disabled={userToEdit.role === 'owner'}><option value="staff">Staff</option><option value="admin">Admin</option>{userToEdit.role === 'owner' && <option value="owner">Owner</option>}</select><button type="submit" disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">{isLoading ? "กำลังอัปเดต..." : "อัปเดตข้อมูล"}</button></form></Modal>);
}

function ProfilePage({ user, userData, showNotification, onProfileUpdate }) {
    const [displayName, setDisplayName] = useState(userData.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photo, setPhoto] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        try {
            let photoURL = userData.photoURL;
            if(photo) {
                const storageRef = ref(storage, `profile-pictures/${user.id}`);
                await uploadBytesResumable(storageRef, photo);
                photoURL = await getDownloadURL(storageRef);
            }
            const updatedData = { displayName, photoURL };
            await updateDoc(doc(db, 'users', user.id), updatedData);
            await logAction(user, 'update_profile', { displayName, photoURL: !!photoURL });
            onProfileUpdate(updatedData);
            showNotification('อัปเดตโปรไฟล์สำเร็จ!', 'success');
        } catch(error) { console.error(error); showNotification('เกิดข้อผิดพลาด', 'error'); } 
        finally { setIsUploading(false); }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { showNotification('รหัสผ่านใหม่ไม่ตรงกัน', 'error'); return; }
        if (newPassword.length < 6) { showNotification('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 'error'); return; }
        try {
            await updateDoc(doc(db, 'users', user.id), { password: encodePass(newPassword) });
            await logAction(user, 'change_password');
            showNotification('เปลี่ยนรหัสผ่านสำเร็จ!', 'success');
            setNewPassword(''); setConfirmPassword('');
        } catch (error) { console.error(error); showNotification('เกิดข้อผิดพลาด', 'error'); }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">โปรไฟล์ของฉัน</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-purple-400">ข้อมูลส่วนตัว</h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="text-center mb-4">
                            <img className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-purple-500" src={userData?.photoURL || `https://placehold.co/112x112/1F2937/A78BFA?text=${(userData?.displayName || 'U').charAt(0).toUpperCase()}`} alt="Profile"/>
                             <input type="file" id="photo-upload" onChange={e => setPhoto(e.target.files[0])} accept="image/png, image/jpeg" className="hidden"/>
                             <label htmlFor="photo-upload" className="mt-4 inline-block bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 py-2 px-4 rounded-lg cursor-pointer">เปลี่ยนรูปโปรไฟล์</label>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-400">ชื่อที่แสดง</label><input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/></div>
                         <button type="submit" disabled={isUploading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">{isUploading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}</button>
                    </form>
                    <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
                        <p><strong className="font-medium text-gray-400">ชื่อผู้ใช้:</strong> {userData.username}</p>
                        <p><strong className="font-medium text-gray-400">สิทธิ์:</strong> <span className="capitalize font-bold text-purple-400">{userData.role}</span></p>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-purple-400">เปลี่ยนรหัสผ่าน</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-400">รหัสผ่านใหม่</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/></div>
                        <div><label className="block text-sm font-medium text-gray-400">ยืนยันรหัสผ่านใหม่</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/></div>
                         <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg">เปลี่ยนรหัสผ่าน</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

// **REVISED Logs Page**
function LogDetailView({ detailsString }) {
    try {
        const details = JSON.parse(detailsString);
        let output = [];
        if(details.description) output.push(details.description)
        if(details.category) output.push(`หมวดหมู่: ${details.category}`);
        if(details.amount) output.push(`(${formatCurrency(details.amount)})`);

        if(details.username) output.push(`ชื่อผู้ใช้: ${details.username}`);
        if(details.newRole) output.push(`-> ${details.newRole}`);
        if(details.title) output.push(details.title)

        if(output.length > 0) return output.join(' ');

        return "ไม่มีรายละเอียดเพิ่มเติม";
    } catch (e) {
        return detailsString.replace(/"/g, '');
    }
}

function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    useEffect(() => {
        const logCollectionPath = `/artifacts/${appId}/public/data/logs`;
        const q = query(collection(db, logCollectionPath), orderBy('timestamp', 'desc'), limit(100));
        const unsub = onSnapshot(q, (snapshot) => setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsub;
    }, []);

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        return logs.filter(log => 
            log.userDisplay?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [logs, searchTerm]);

    const formatAction = (action) => {
        const actions = {
            login_success: 'เข้าสู่ระบบ', logout: 'ออกจากระบบ', login_failed: 'เข้าระบบล้มเหลว',
            create_transaction: 'สร้างรายการเงิน', delete_transaction: 'ลบรายการเงิน',
            create_category: 'สร้างหมวดหมู่', delete_category: 'ลบหมวดหมู่',
            create_event: 'สร้างกิจกรรม', delete_event: 'ลบกิจกรรม',
            update_profile: 'อัปเดตโปรไฟล์', change_password: 'เปลี่ยนรหัสผ่าน',
            export_report_csv: 'ส่งออก CSV', export_yearly_excel: 'ส่งออก Excel',
            create_user: 'สร้างผู้ใช้ใหม่', delete_user: 'ลบผู้ใช้', update_user: 'อัปเดตผู้ใช้'
        };
        const actionStyle = {
            login_success: 'bg-green-500/20 text-green-400', logout: 'bg-yellow-500/20 text-yellow-400', login_failed: 'bg-red-500/20 text-red-400',
            create_transaction: 'bg-blue-500/20 text-blue-400', delete_transaction: 'bg-red-500/20 text-red-400', create_event: 'bg-blue-500/20 text-blue-400',
            create_user: 'bg-green-500/20 text-green-400', delete_user: 'bg-red-500/20 text-red-400', update_user: 'bg-yellow-500/20 text-yellow-400',
        }
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionStyle[action] || 'bg-gray-500/20 text-gray-400'}`}>{actions[action] || action}</span>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white">Log</h2>
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                    <input type="text" placeholder="ค้นหา..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64 bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-purple-500"/>
                </div>
            </div>
             <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
                <div className="space-y-3">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="bg-gray-900/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-grow mb-2 sm:mb-0">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="font-semibold text-white">{log.userDisplay || 'System'}</span>
                                    {formatAction(log.action)}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{formatFullDate(log.timestamp)}</p>
                            </div>
                            <p className="text-sm text-gray-400 break-all"><LogDetailView detailsString={log.details} /></p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

