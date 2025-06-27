import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    updatePassword,
    sendPasswordResetEmail,
    signOut,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    getDoc, 
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
// Note: Recharts is a new library, you need to update package.json
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    Home,
    DollarSign, 
    Calendar, 
    BarChart2 as ReportIcon, 
    Settings, 
    User, 
    LogOut, 
    Plus,
    Edit,
    Trash2,
    FileText,
    X,
    Menu,
    Users,
    History,
    AlertTriangle,
    KeyRound,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    UploadCloud,
    CheckCircle
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Helper Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
const formatFullDate = (date) => date ? new Date(date.seconds * 1000).toLocaleString('th-TH') : 'N/A';
const formatDateForInput = (date) => date ? new Date(date.seconds * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);


const logAction = async (user, action, details = {}) => {
    try {
        if (!user) return;
        const logData = {
            action,
            userId: user.uid,
            userEmail: user.email,
            timestamp: Timestamp.now(),
            details: JSON.stringify(details, null, 2) // Pretty print JSON
        };
        const logCollectionPath = `/artifacts/${appId}/public/data/logs`;
        await addDoc(collection(db, logCollectionPath), logData);
    } catch (error) {
        console.error("Error logging action:", error);
    }
};

// --- Reusable Components ---
function Modal({ isOpen, onClose, children, title }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl shadow-xl w-full max-w-lg text-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-purple-400">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                </div>
                {children}
            </div>
        </div>
    );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "ยืนยัน" }) {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="py-2 px-6 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors">
                        ยกเลิก
                    </button>
                    <button onClick={onConfirm} className="py-2 px-6 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors">
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('home'); // Changed from 'dashboard'
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setIsLoading(true);
            if (authUser) {
                const userDocRef = doc(db, 'users', authUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const fetchedUserData = { uid: authUser.uid, email: authUser.email, ...docSnap.data() };
                        setUser(authUser);
                        setUserData(fetchedUserData);
                    } else {
                        console.log("User document not found, creating one:", authUser.uid);
                        const defaultUserData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            displayName: authUser.email.split('@')[0],
                            role: 'staff',
                            photoURL: '',
                            createdAt: Timestamp.now()
                        };
                        setDoc(doc(db, 'users', authUser.uid), defaultUserData);
                        setUser(authUser);
                        setUserData(defaultUserData);
                    }
                    setIsLoading(false);
                });
                return () => unsubDoc();
            } else {
                setUser(null);
                setUserData(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await logAction(user, 'logout');
        await signOut(auth);
        setCurrentPage('home');
    };
    
    const navigateTo = (page) => {
      setCurrentPage(page);
      setIsSidebarOpen(false);
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-purple-400"><div className="text-xl font-semibold animate-pulse">กำลังโหลด...</div></div>;
    }

    if (!user) {
        return <AuthPage />;
    }

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
            {notification.show && (
                <div className={`fixed top-5 right-5 text-white py-2 px-4 rounded-lg shadow-2xl z-[100] ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {notification.message}
                </div>
            )}
            <Sidebar 
                currentPage={currentPage} 
                navigateTo={navigateTo}
                userRole={userData?.role}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    userData={userData}
                    handleLogout={handleLogout} 
                    setIsSidebarOpen={setIsSidebarOpen}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <PageContent 
                        page={currentPage} 
                        user={user} 
                        userData={userData} 
                        showNotification={showNotification}
                        navigateTo={navigateTo}
                    />
                </main>
            </div>
        </div>
    );
}

// --- Authentication Page ---
function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await logAction(userCredential.user, 'login_success');
        } catch (err) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            await logAction(null, 'login_failed', { email });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-purple-900/20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">BlackOffice <span className="text-purple-400">Jimiko</span></h2>
                    <p className="text-gray-400 mt-2">โปรแกรมจัดการธุรกิจของคุณ</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-400 block mb-2">อีเมล</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-400 block mb-2">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 disabled:bg-gray-500 disabled:shadow-none"
                        >
                            {isLoading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                        </button>
                    </div>
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
        { id: 'reports', label: 'รายงาน', icon: ReportIcon, roles: ['admin', 'owner'] },
        { id: 'settings', label: 'ตั้งค่า', icon: Settings, roles: ['admin', 'owner'] },
        { id: 'profile', label: 'โปรไฟล์', icon: User, roles: ['staff', 'admin', 'owner'] },
        { id: 'logs', label: 'ประวัติการใช้งาน', icon: History, roles: ['owner'] },
    ];
    
    return (
        <aside className={`bg-gray-800 border-r border-gray-700 text-gray-300 w-64 space-y-2 py-4 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
            <div className="px-4 pb-4 border-b border-gray-700 flex items-center justify-between">
                <h1 className="text-xl font-bold text-white">Black<span className="text-purple-400">Office</span></h1>
                 <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white md:hidden">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-grow pt-4">
                {userRole ? navItems
                    .filter(item => item.roles.includes(userRole))
                    .map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); navigateTo(item.id); }}
                        className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 mb-1 ${currentPage === item.id ? 'bg-purple-600 text-white shadow-lg' : 'hover:bg-gray-700 hover:text-white'}`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-semibold">{item.label}</span>
                    </a>
                )) : <div className="p-4 text-sm text-gray-500">กำลังโหลดเมนู...</div> }
            </nav>
        </aside>
    );
}

function Header({ userData, handleLogout, setIsSidebarOpen }) {
    return (
        <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center z-20">
             <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 focus:outline-none md:hidden">
                <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-gray-200 hidden md:block">
                {/* Could be a breadcrumb or page title */}
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold text-white">{userData?.displayName || userData?.email}</p>
                    <p className="text-sm text-purple-400 capitalize font-medium">{userData?.role}</p>
                </div>
                 <img
                    className="h-11 w-11 rounded-full object-cover border-2 border-purple-500"
                    src={userData?.photoURL || `https://placehold.co/44x44/1F2937/A78BFA?text=${(userData?.displayName || 'U').charAt(0).toUpperCase()}`}
                    alt="โปรไฟล์"
                />
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="ออกจากระบบ">
                    <LogOut className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}

function PageContent({ page, user, userData, showNotification, navigateTo }) {
    if (!userData) {
         return <div className="flex items-center justify-center h-full"><div className="text-xl font-semibold text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div></div>;
    }
    switch (page) {
        case 'home':
            return <HomePage user={user} navigateTo={navigateTo}/>;
        case 'finance':
            return <FinancePage user={user} userData={userData}/>;
        case 'calendar':
            return <CalendarPage user={user} userData={userData} showNotification={showNotification}/>;
        case 'reports':
            return <ReportsPage user={user} userData={userData} />;
        case 'settings':
            return <SettingsPage user={user} userData={userData} showNotification={showNotification} />;
        case 'profile':
            return <ProfilePage user={user} userData={userData} showNotification={showNotification} />;
        case 'logs':
            return <LogsPage />;
        default:
            return <div>Page not found</div>;
    }
}

// --- Page Components ---

function HomePage({user, navigateTo}) {
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, events: 0 });
    const [latestTx, setLatestTx] = useState([]);
    
    useEffect(() => {
        const finPath = `/artifacts/${appId}/public/data/finances`;
        const eventsPath = `/artifacts/${appId}/public/data/events`;
        
        // Summary listener
        const unsubFin = onSnapshot(collection(db, finPath), (snapshot) => {
            let totalIncome = 0, totalExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.type === 'income') totalIncome += data.amount;
                else totalExpense += data.amount;
            });
            setSummary(prev => ({ ...prev, income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense }));
        });

        // Latest transactions listener
        const qTx = query(collection(db, finPath), orderBy('createdAt', 'desc'), limit(3));
        const unsubLatestTx = onSnapshot(qTx, (snapshot) => {
            setLatestTx(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        // Events count listener
        const unsubEvents = onSnapshot(collection(db, eventsPath), (snapshot) => {
            setSummary(prev => ({ ...prev, events: snapshot.size }));
        });
        
        return () => {
            unsubFin();
            unsubEvents();
            unsubLatestTx();
        };
    }, []);

    const SummaryCard = ({ title, value, icon, color, page }) => (
        <div 
            onClick={() => navigateTo(page)}
            className={`bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg hover:border-${color}-500 hover:shadow-${color}-500/20 transition-all duration-300 cursor-pointer group`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400 font-medium">{title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{typeof value === 'number' ? formatCurrency(value) : value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${color}-600/20 text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
                   {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">หน้าแรก</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <SummaryCard title="รายรับทั้งหมด" value={summary.income} icon={<DollarSign/>} color="green" page="reports" />
                <SummaryCard title="รายจ่ายทั้งหมด" value={summary.expense} icon={<DollarSign/>} color="red" page="reports" />
                <SummaryCard title="คงเหลือทั้งหมด" value={summary.balance} icon={<DollarSign/>} color="purple" page="reports" />
                <SummaryCard title="กิจกรรมในปฏิทิน" value={summary.events} icon={<Calendar/>} color="blue" page="calendar" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">รายการล่าสุด</h3>
                    <div className="space-y-4">
                        {latestTx.length > 0 ? latestTx.map(t => (
                            <div key={t.id} className="flex items-center justify-between bg-gray-700/50 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <div className={`w-3 h-3 rounded-full mr-4 ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div>
                                        <p className="font-semibold text-white">{t.description || "ไม่มีรายละเอียด"}</p>
                                        <p className="text-sm text-gray-400">{t.category} • {formatFullDate(t.createdAt)}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-8">ยังไม่มีรายการ...</p>
                        )}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-600 to-red-500 p-6 rounded-2xl flex flex-col justify-center items-center text-center shadow-lg">
                     <h3 className="text-2xl font-bold text-white">จัดการธุรกิจของคุณ</h3>
                     <p className="text-purple-200 mt-2 mb-4">เพิ่มรายรับ-รายจ่าย หรือสร้างกิจกรรมใหม่ได้ง่ายๆ</p>
                     <button onClick={() => navigateTo('finance')} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg transition-colors backdrop-blur-sm">
                        ไปที่หน้ารายรับ-รายจ่าย
                     </button>
                </div>
            </div>
        </div>
    );
}


function FinancePage({ user, userData }) {
    const [transactions, setTransactions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;

    useEffect(() => {
        const q = query(collection(db, financeCollectionPath), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(transData);
        });
        return unsubscribe;
    }, []);

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, financeCollectionPath, id));
        await logAction(user, 'delete_transaction', { transactionId: id });
    };

    return (
        <div className="relative min-h-full">
            <h2 className="text-3xl font-bold text-white mb-6">รายรับ-รายจ่าย</h2>
            <div className="space-y-3">
                 {transactions.length > 0 ? transactions.map(t => (
                    <div key={t.id} className="bg-gray-800 border border-gray-700 p-4 rounded-xl flex items-center justify-between transition hover:border-purple-500">
                         <div className="flex items-center">
                            <div className={`p-3 rounded-full mr-4 ${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                <DollarSign size={20}/>
                            </div>
                            <div>
                                <p className="font-semibold text-white">{t.description || "ไม่มีรายละเอียด"}</p>
                                <p className="text-sm text-gray-400">{t.category}</p>
                                <p className="text-xs text-gray-500 mt-1">บันทึกเมื่อ: {formatFullDate(t.createdAt)}</p>
                            </div>
                        </div>
                         <div className="flex items-center space-x-4">
                            {t.fileURL && <a href={t.fileURL} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300"><FileText/></a>}
                            <p className={`font-bold text-xl ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </p>
                             <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={18}/></button>
                        </div>
                    </div>
                 )) : (
                    <div className="text-center py-20">
                        <p className="text-gray-500">ยังไม่มีรายการ...</p>
                        <p className="text-gray-600">กดปุ่ม + เพื่อเพิ่มรายการแรกของคุณ</p>
                    </div>
                 )}
            </div>

            {/* Floating Action Button */}
            <button 
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-purple-600/40 transition-transform hover:scale-110"
                title="เพิ่มรายการใหม่"
            >
                <Plus size={32}/>
            </button>
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

    const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
    const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;

     useEffect(() => {
        if (!isOpen) return;
        // Reset form on open
        setType('expense');
        setAmount('');
        setDescription('');
        setFile(null);
        setError('');

        const q = query(collection(db, categoriesCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const catData = snapshot.docs.map(doc => doc.data().name);
            setCategories(catData);
            if (catData.length > 0) {
                setCategory(catData[0]);
            }
        });
        return unsubscribe;
    }, [isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('ไฟล์ต้องเป็น JPG, PNG, หรือ PDF เท่านั้น'); return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
                setError('ขนาดไฟล์ต้องไม่เกิน 5MB'); return;
            }
            setError(''); setFile(selectedFile);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!amount || !category) {
            setError("กรุณากรอกจำนวนเงินและเลือกหมวดหมู่");
            return;
        }
        setUploading(true);
        setError('');

        let fileURL = '';
        if (file) {
            const storageRef = ref(storage, `attachments/${user.uid}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            try {
                await uploadTask;
                fileURL = await getDownloadURL(uploadTask.snapshot.ref);
            } catch (err) {
                setError('อัปโหลดไฟล์ล้มเหลว'); setUploading(false); return;
            }
        }

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category,
            description,
            userId: user.uid,
            fileURL,
            createdAt: Timestamp.now()
        };

        try {
            const docRef = await addDoc(collection(db, financeCollectionPath), transactionData);
            await logAction(user, 'create_transaction', { transactionId: docRef.id, ...transactionData });
            onClose();
        } catch (err) {
            setError('บันทึกข้อมูลล้มเหลว');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="เพิ่มรายการใหม่">
             <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setType('income')} className={`py-3 rounded-lg font-bold transition-colors ${type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>รายรับ</button>
                    <button type="button" onClick={() => setType('expense')} className={`py-3 rounded-lg font-bold transition-colors ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>รายจ่าย</button>
                </div>

                {/* Amount */}
                <div>
                    <label className="text-sm font-medium text-gray-400">จำนวนเงิน</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"/>
                </div>
                
                {/* Category */}
                 <div>
                    <label className="text-sm font-medium text-gray-400">หมวดหมู่</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-gray-400">รายละเอียด</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"></textarea>
                </div>

                {/* File Upload */}
                <div>
                    <label className="text-sm font-medium text-gray-400">ไฟล์แนบ (ถ้ามี)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                            <div className="flex text-sm text-gray-400">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-purple-400 hover:text-purple-300 px-2">
                                    <span>อัปโหลดไฟล์</span>
                                    <input id="file-upload" name="file-upload" type="file" onChange={handleFileChange} className="sr-only"/>
                                </label>
                                <p className="pl-1">หรือลากมาวาง</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, PDF ไม่เกิน 5MB</p>
                        </div>
                    </div>
                    {file && <p className="text-sm text-green-400 mt-2 text-center">{file.name}</p>}
                </div>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                {/* Submit Button */}
                <div className="pt-2">
                    <button type="submit" disabled={uploading} className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-lg shadow-purple-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-300 disabled:bg-gray-500 disabled:shadow-none">
                        {uploading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function CalendarPage({ user, userData, showNotification }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const eventsCollectionPath = `/artifacts/${appId}/public/data/events`;

    useEffect(() => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const q = query(
            collection(db, eventsCollectionPath),
            where('date', '>=', firstDayOfMonth),
            where('date', '<=', lastDayOfMonth)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        });
        return unsubscribe;
    }, [currentDate]);
    
    const handleAddEventClick = (date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const calendarDays = [];
    for (let i = 0; i < firstDayIndex; i++) {
        calendarDays.push({ key: `empty-${i}`, empty: true });
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        calendarDays.push({ 
            key: `day-${day}`, 
            day, 
            date, 
            isToday: day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
        });
    }

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    
    return(
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">ปฏิทินงาน</h2>
                <div className="flex items-center space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronLeft/></button>
                    <span className="text-xl font-semibold text-purple-400 w-48 text-center">
                        {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600"><ChevronRight/></button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 bg-gray-800 p-2 rounded-xl">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="text-center font-bold text-gray-400 py-2">{day}</div>
                ))}
                {calendarDays.map(item => {
                    if(item.empty) return <div key={item.key}></div>;
                    
                    const dayEvents = events.filter(e => new Date(e.date.seconds * 1000).getDate() === item.day);
                    
                    return (
                        <div key={item.key} className="bg-gray-900 rounded-lg h-40 p-2 flex flex-col relative group">
                            <time dateTime={item.date.toISOString()} className={`font-bold ${item.isToday ? 'bg-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-300'}`}>
                                {item.day}
                            </time>
                            <div className="flex-grow overflow-y-auto mt-1 space-y-1">
                                {dayEvents.map(event => (
                                    <div key={event.id} className="bg-purple-900/50 p-1 rounded-md text-xs">
                                        <p className="text-white truncate font-semibold">{event.title}</p>
                                        {event.imageURL && <img src={event.imageURL} className="w-full h-10 object-cover rounded-sm mt-1"/>}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleAddEventClick(item.date)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                <Plus size={16}/>
                            </button>
                        </div>
                    );
                })}
            </div>
            <CalendarEventModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                eventDate={selectedDate}
                showNotification={showNotification}
            />
        </div>
    );
}

function CalendarEventModal({ isOpen, onClose, user, eventDate, showNotification }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    useEffect(() => {
        if(isOpen) {
            setTitle('');
            setDescription('');
            setFile(null);
        }
    }, [isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
        } else {
            showNotification("กรุณาเลือกไฟล์รูปภาพเท่านั้น", "error");
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!title) return;
        setUploading(true);
        
        let imageURL = '';
        if (file) {
            const storageRef = ref(storage, `event-images/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            try {
                await uploadTask;
                imageURL = await getDownloadURL(uploadTask.snapshot.ref);
            } catch (err) {
                 setUploading(false);
                 showNotification("อัปโหลดรูปภาพล้มเหลว", "error");
                 return;
            }
        }

        const eventData = {
            title,
            description,
            date: Timestamp.fromDate(eventDate),
            imageURL,
            createdBy: user.uid,
            createdAt: Timestamp.now()
        };

        try {
            const docRef = await addDoc(collection(db, `/artifacts/${appId}/public/data/events`), eventData);
            await logAction(user, 'create_event', { eventId: docRef.id, title });
            showNotification("สร้างกิจกรรมสำเร็จ!", "success");
            onClose();
        } catch (err) {
             showNotification("สร้างกิจกรรมล้มเหลว", "error");
        } finally {
            setUploading(false);
        }
    };

    return(
        <Modal isOpen={isOpen} onClose={onClose} title={`สร้างกิจกรรมสำหรับวันที่ ${eventDate?.toLocaleDateString('th-TH')}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="ชื่องาน" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                <textarea placeholder="รายละเอียด..." value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"></textarea>
                <div>
                     <label className="text-sm font-medium text-gray-400">แนบรูปภาพ</label>
                     <input type="file" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/50 file:text-purple-300 hover:file:bg-purple-600"/>
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
    const [filteredData, setFilteredData] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
        end: new Date().toISOString().slice(0, 10),
    });

    const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
    
    useEffect(() => {
        const q = query(collection(db, financeCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
             const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             setTransactions(data);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        
        const filtered = transactions.filter(t => {
            const tDate = t.createdAt.toDate();
            return tDate >= start && tDate <= end;
        });
        setFilteredData(filtered);
    }, [dateRange, transactions]);

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    const exportToCSV = () => {
        let csvContent = "\uFEFF" + "data:text/csv;charset=utf-8,";
        csvContent += "วันที่บันทึก,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน,ไฟล์แนบ\n";
        
        filteredData.forEach(row => {
            const date = formatFullDate(row.createdAt);
            const type = row.type === 'income' ? 'รายรับ' : 'รายจ่าย';
            const description = `"${row.description.replace(/"/g, '""')}"`
            const line = `"${date}","${type}","${row.category}",${description},${row.amount},"${row.fileURL}"\n`;
            csvContent += line;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${dateRange.start}_to_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        logAction(user, 'export_report_csv', { dateRange });
    };

    const summary = useMemo(() => {
        return filteredData.reduce((acc, t) => {
            if (t.type === 'income') acc.income += t.amount;
            else acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0 });
    }, [filteredData]);

    const chartData = [
        { name: 'รายรับ', value: summary.income, fill: '#4ade80' },
        { name: 'รายจ่าย', value: summary.expense, fill: '#f87171' }
    ];

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">รายงาน</h2>
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">วันที่เริ่มต้น</label>
                            <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">วันที่สิ้นสุด</label>
                            <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                        </div>
                    </div>
                    {userData.role === 'owner' && (
                        <button onClick={exportToCSV} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 w-full md:w-auto">
                            Export to CSV
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                 <h3 className="text-xl font-bold text-white mb-4">สรุปและกราฟ</h3>
                 <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" tick={{ fill: '#a0aec0' }} />
                            <YAxis tickFormatter={(value) => formatCurrency(value)} tick={{ fill: '#a0aec0' }}/>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4A5568', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#A78BFA' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" barSize={80} radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-center">
                     <div className="bg-green-500/10 p-4 rounded-lg"><p className="text-green-400 font-semibold">รายรับรวม: {formatCurrency(summary.income)}</p></div>
                     <div className="bg-red-500/10 p-4 rounded-lg"><p className="text-red-400 font-semibold">รายจ่ายรวม: {formatCurrency(summary.expense)}</p></div>
                     <div className="bg-purple-500/10 p-4 rounded-lg"><p className="text-purple-400 font-semibold">คงเหลือ: {formatCurrency(summary.income - summary.expense)}</p></div>
                 </div>
            </div>
        </div>
    );
}

function SettingsPage({ user, userData, showNotification }) {
    const [currentTab, setCurrentTab] = useState('categories');
    
    return (
        <div className="space-y-8">
             <h2 className="text-3xl font-bold text-white">ตั้งค่าระบบ</h2>
             <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <div className="flex border-b border-gray-700 mb-6">
                    <button onClick={() => setCurrentTab('categories')} className={`py-2 px-4 font-semibold transition-colors ${currentTab === 'categories' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                        จัดการหมวดหมู่
                    </button>
                    {userData.role === 'owner' && (
                        <button onClick={() => setCurrentTab('users')} className={`py-2 px-4 font-semibold transition-colors ${currentTab === 'users' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                            จัดการผู้ใช้งาน
                        </button>
                    )}
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
    const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;

    useEffect(() => {
        const q = query(collection(db, categoriesCollectionPath), orderBy('name'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setCategories(snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name})));
        });
        return unsubscribe;
    }, []);

    const handleAddCategory = async () => {
        if (newCategoryName.trim() === '') return;
        const newCategory = { name: newCategoryName.trim() };
        await addDoc(collection(db, categoriesCollectionPath), newCategory);
        await logAction(user, 'create_category', newCategory);
        setNewCategoryName('');
    };

    const handleDeleteCategory = async (id) => {
        await deleteDoc(doc(db, categoriesCollectionPath, id));
        await logAction(user, 'delete_category', { categoryId: id });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">หมวดหมู่รายรับ-รายจ่าย</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="ชื่อหมวดหมู่ใหม่"
                    className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
                <button onClick={handleAddCategory} className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700">เพิ่ม</button>
            </div>
            <div className="space-y-2">
                {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                        <span className="text-gray-200">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UserSettings({ owner, showNotification }) {
    const [users, setUsers] = useState([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    
    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsub = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsub;
    }, []);
    
    const handleRoleChange = async (targetUserId, newRole) => {
        if (owner.uid === targetUserId) {
            showNotification("ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้", 'error'); return;
        }
        await updateDoc(doc(db, 'users', targetUserId), { role: newRole });
        await logAction(owner, 'permission_change', { targetUserId, newRole });
        showNotification("เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ", 'success');
    };

    const handleDeleteUserDoc = async (targetUserId) => {
        if (owner.uid === targetUserId) {
             showNotification("ไม่สามารถลบข้อมูลตนเองได้", 'error'); return;
        }
        await deleteDoc(doc(db, 'users', targetUserId));
        await logAction(owner, 'delete_user_doc', { targetUserId });
        showNotification("ลบเอกสารข้อมูลผู้ใช้แล้ว", 'success');
        // A non-blocking alert is better than window.alert
        showNotification("ขั้นตอนต่อไป: ไปที่ Firebase Console เพื่อลบบัญชี", "info");
    }

    return (
        <div className="space-y-4">
            {isAddUserModalOpen && <AddUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} showNotification={showNotification} owner={owner} />}
            <div className="bg-purple-900/30 border border-purple-700 text-purple-300 p-4 rounded-lg">
                <h4 className="font-bold">คำแนะนำในการจัดการผู้ใช้</h4>
                <p className="text-sm mt-1">การเพิ่ม/ลบผู้ใช้ จะเป็นการสร้าง/ลบเฉพาะ "ข้อมูล" ในระบบเท่านั้น คุณต้องไปสร้าง/ลบบัญชีจริงใน Firebase Console ด้วยตนเอง</p>
            </div>
            <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white">รายชื่อผู้ใช้งาน</h3>
                 <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700"><UserPlus className="mr-2"/>เพิ่มผู้ใช้</button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-3">อีเมล / ชื่อ</th>
                            <th className="p-3">สิทธิ์</th>
                            <th className="p-3 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                                <td className="p-3"><p className="font-semibold text-white">{u.displayName}</p><p className="text-sm text-gray-400">{u.email}</p></td>
                                <td className="p-3">
                                     <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="p-2 bg-gray-700 border border-gray-600 rounded-md disabled:opacity-50" disabled={owner.uid === u.id || u.role === 'owner'}>
                                        <option value="owner">Owner</option>
                                        <option value="admin">Admin</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </td>
                                <td className="p-3 text-center space-x-2">
                                    <button onClick={() => sendPasswordResetEmail(auth, u.email)} className="p-2 text-gray-400 hover:text-blue-400" title="รีเซ็ตรหัสผ่าน"><KeyRound/></button>
                                    <button onClick={() => handleDeleteUserDoc(u.id)} className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-50" title="ลบผู้ใช้" disabled={owner.uid === u.id || u.role === 'owner'}><Trash2/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AddUserModal({ isOpen, onClose, showNotification, owner }) {
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('staff');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreated, setIsCreated] = useState(false);

    const handleCreateUserRecord = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const userRecord = {
            email, displayName, role, photoURL: '', createdAt: Timestamp.now()
        };
        try {
            // We use the email as a temporary doc ID
            await setDoc(doc(db, "users", email), userRecord, { merge: true }); // Using email as temp ID is a workaround
            await logAction(owner, 'create_user_record', userRecord);
            showNotification("สร้างข้อมูลผู้ใช้สำเร็จ!", 'success');
            setIsCreated(true);
        } catch(err) {
            showNotification("เกิดข้อผิดพลาดในการสร้างข้อมูล", 'error');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setIsCreated(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="เพิ่มผู้ใช้ใหม่">
            {isCreated ? (
                <div className="text-center space-y-4">
                     <CheckCircle className="mx-auto h-16 w-16 text-green-400"/>
                     <h4 className="text-xl font-bold text-white">สร้างข้อมูลผู้ใช้สำเร็จ</h4>
                     <div className="bg-gray-700 p-4 rounded-lg text-left text-sm space-y-2">
                        <p className="font-bold">ขั้นตอนต่อไป (สำคัญมาก):</p>
                        <p>1. ไปที่ <b className="text-purple-400">Firebase Console</b></p>
                        <p>2. ไปที่เมนู <b className="text-purple-400">Authentication</b></p>
                        <p>3. กดปุ่ม <b className="text-purple-400">Add user</b> และใช้อีเมล: <b className="text-yellow-400">{email}</b></p>
                        <p>4. ตั้งรหัสผ่านชั่วคราวแล้วแจ้งให้ผู้ใช้ทราบ</p>
                        <p>5. เมื่อผู้ใช้ล็อกอินครั้งแรก ระบบจะตรวจหา UID และอัปเดตเอกสารข้อมูลให้ถูกต้อง</p>
                     </div>
                     <button onClick={handleClose} className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-700 rounded-lg">เสร็จสิ้น</button>
                </div>
            ) : (
                 <form onSubmit={handleCreateUserRecord} className="space-y-4">
                    <p className="text-sm text-gray-400">ขั้นตอนนี้จะสร้าง "เอกสารข้อมูล" สำหรับผู้ใช้ใหม่ในระบบก่อน</p>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมลผู้ใช้ใหม่" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ชื่อที่แสดง" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" disabled={isLoading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">
                         {isLoading ? "กำลังสร้างข้อมูล..." : "สร้างข้อมูลผู้ใช้ (ขั้นตอนที่ 1)"}
                    </button>
                </form>
            )}
        </Modal>
    );
}


function ProfilePage({ user, userData, showNotification }) {
    const [displayName, setDisplayName] = useState(userData.displayName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [photo, setPhoto] = useState(null);
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsUploading(true);
        try {
            let photoURL = userData.photoURL;
            if(photo) {
                const storageRef = ref(storage, `profile-pictures/${user.uid}`);
                await uploadBytesResumable(storageRef, photo);
                photoURL = await getDownloadURL(storageRef);
            }
            
            await updateDoc(doc(db, 'users', user.uid), { displayName, photoURL });
            await logAction(user, 'update_profile', { displayName, photoURL: !!photoURL });
            showNotification('อัปเดตโปรไฟล์สำเร็จ!', 'success');
        } catch(error) {
            console.error(error);
            showNotification('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์', 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword !== confirmPassword) {
            showNotification('รหัสผ่านใหม่ไม่ตรงกัน', 'error'); return;
        }
        if (newPassword.length < 6) {
            showNotification('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 'error'); return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            await logAction(user, 'change_password');
            showNotification('เปลี่ยนรหัสผ่านสำเร็จ!', 'success');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) {
            console.error(error);
            showNotification('เกิดข้อผิดพลาด: รหัสผ่านปัจจุบันอาจไม่ถูกต้อง', 'error');
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">โปรไฟล์ของฉัน</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-purple-400">ข้อมูลส่วนตัว</h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="text-center mb-4">
                            <img 
                                className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-purple-500"
                                src={userData?.photoURL || `https://placehold.co/112x112/1F2937/A78BFA?text=${(userData?.displayName || 'U').charAt(0).toUpperCase()}`}
                                alt="Profile"
                            />
                             <input type="file" id="photo-upload" onChange={e => setPhoto(e.target.files[0])} accept="image/png, image/jpeg" className="hidden"/>
                             <label htmlFor="photo-upload" className="mt-4 inline-block bg-gray-700 hover:bg-gray-600 text-sm text-gray-200 py-2 px-4 rounded-lg cursor-pointer">เปลี่ยนรูปโปรไฟล์</label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">ชื่อที่แสดง</label>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                        </div>
                         <button type="submit" disabled={isUploading} className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:bg-gray-500">
                             {isUploading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
                        </button>
                    </form>
                    <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
                        <p><strong className="font-medium text-gray-400">อีเมล:</strong> {userData.email}</p>
                        <p><strong className="font-medium text-gray-400">สิทธิ์:</strong> <span className="capitalize font-bold text-purple-400">{userData.role}</span></p>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-purple-400">เปลี่ยนรหัสผ่าน</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-400">รหัสผ่านปัจจุบัน</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">รหัสผ่านใหม่</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">ยืนยันรหัสผ่านใหม่</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"/>
                        </div>
                         <button type="submit" className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg">เปลี่ยนรหัสผ่าน</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function LogDetailView({ detailsString }) {
    try {
        const details = JSON.parse(detailsString);
        return (
            <div className="bg-gray-900 p-2 rounded-md font-mono text-xs">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex">
                        <span className="text-purple-400 w-32 flex-shrink-0">{key}:</span>
                        <span className="text-gray-300 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                    </div>
                ))}
            </div>
        )
    } catch (e) {
        return <span className="text-gray-500">{detailsString}</span>;
    }
}

function LogsPage() {
    const [logs, setLogs] = useState([]);
    const logCollectionPath = `/artifacts/${appId}/public/data/logs`;

    useEffect(() => {
        const q = query(collection(db, logCollectionPath), orderBy('timestamp', 'desc'), limit(50));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    const formatAction = (action) => {
        const actions = {
            login_success: 'เข้าสู่ระบบสำเร็จ', logout: 'ออกจากระบบ', login_failed: 'เข้าระบบล้มเหลว',
            create_transaction: 'สร้างรายการเงิน', delete_transaction: 'ลบรายการเงิน',
            create_category: 'สร้างหมวดหมู่', delete_category: 'ลบหมวดหมู่',
            create_event: 'สร้างกิจกรรม',
            permission_change: 'เปลี่ยนสิทธิ์',
            update_profile: 'อัปเดตโปรไฟล์', change_password: 'เปลี่ยนรหัสผ่าน',
            export_report_csv: 'ส่งออก CSV', reset_password_request: 'ขอรีเซ็ตรหัสผ่าน',
            delete_user_doc: 'ลบข้อมูลผู้ใช้', create_user_record: 'สร้างข้อมูลผู้ใช้',
        };
        const actionStyle = {
            login_success: 'bg-green-500/20 text-green-400',
            logout: 'bg-yellow-500/20 text-yellow-400',
            login_failed: 'bg-red-500/20 text-red-400',
            create_transaction: 'bg-blue-500/20 text-blue-400',
            delete_transaction: 'bg-red-500/20 text-red-400',
        }
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${actionStyle[action] || 'bg-gray-500/20 text-gray-400'}`}>{actions[action] || action}</span>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">ประวัติการใช้งานระบบ</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-gray-300">เวลา</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">ผู้ใช้งาน</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">การกระทำ</th>
                                <th className="p-3 text-sm font-semibold text-gray-300">รายละเอียด</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-t border-gray-700">
                                    <td className="p-3 whitespace-nowrap text-sm text-gray-400">{formatFullDate(log.timestamp)}</td>
                                    <td className="p-3 text-sm text-gray-300">{log.userEmail}</td>
                                    <td className="p-3">{formatAction(log.action)}</td>
                                    <td className="p-3"><LogDetailView detailsString={log.details} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
