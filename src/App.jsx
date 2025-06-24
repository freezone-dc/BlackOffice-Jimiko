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
    Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL 
} from 'firebase/storage';
import { 
    LayoutDashboard, 
    DollarSign, 
    Calendar, 
    BarChart2, 
    Settings, 
    User, 
    LogOut, 
    PlusCircle,
    Edit,
    Trash2,
    FileText,
    X,
    Menu,
    Users,
    History,
    AlertTriangle,
    KeyRound,
    UserPlus
} from 'lucide-react';

// --- Firebase Configuration ---
// หมายเหตุ: กรุณาแทนที่ด้วยค่า firebaseConfig จากโปรเจกต์ของคุณเอง
const firebaseConfig = {
  apiKey: "AIzaSyAn6mUtQbDlRRed-wMuIAIdJKnqoTt7fNQ",
  authDomain: "dc-e-01.firebaseapp.com",
  databaseURL: "https://dc-e-01-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dc-e-01",
  storageBucket: "dc-e-01.appspot.com",
  messagingSenderId: "840620905723",
  appId: "1:840620905723:web:002b11b102aa90b19c4c5e"
};


const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app); // Initialize Cloud Functions

// --- Helper Functions ---
const formatCurrency = (amount) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
const formatDate = (date) => date ? new Date(date.seconds * 1000).toLocaleDateString('th-TH') : 'N/A';

const logAction = async (user, action, details = {}) => {
    try {
        if (!user) return;
        const logData = {
            action,
            userId: user.uid,
            userEmail: user.email,
            timestamp: Timestamp.now(),
            details: JSON.stringify(details)
        };
        // ใช้ path ที่รองรับสภาพแวดล้อมของคุณ
        const logCollectionPath = `/artifacts/${appId}/public/data/logs`;
        await addDoc(collection(db, logCollectionPath), logData);
    } catch (error) {
        console.error("Error logging action:", error);
    }
};

// --- Reusable Modal Component ---
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "ยืนยัน" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{title}</h3>
                    </div>
                </div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        ยกเลิก
                    </button>
                    <button type="button" onClick={onConfirm} className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}


// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                const userDocRef = doc(db, 'users', authUser.uid);
                const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                     if (docSnap.exists()) {
                        const fetchedUserData = { uid: authUser.uid, email: authUser.email, ...docSnap.data() };
                        setUser(authUser);
                        setUserData(fetchedUserData);
                    } else {
                        console.log("User document does not exist for UID:", authUser.uid);
                        // สร้าง document เริ่มต้นถ้ายังไม่มี
                        const defaultUserData = {
                            uid: authUser.uid,
                            email: authUser.email,
                            displayName: authUser.email.split('@')[0],
                            role: 'staff', // สิทธิ์เริ่มต้น
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
        setCurrentPage('dashboard');
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100"><div className="text-xl font-semibold">กำลังโหลด...</div></div>;
    }

    if (!user) {
        return <AuthPage />;
    }

    return (
        <div className="flex h-screen bg-gray-50 text-gray-800">
            {notification.show && (
                <div className={`fixed top-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            <Sidebar 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage}
                userRole={userData?.role}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    user={user} 
                    userData={userData}
                    handleLogout={handleLogout} 
                    setIsSidebarOpen={setIsSidebarOpen}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 sm:p-6">
                    <PageContent 
                        page={currentPage} 
                        user={user} 
                        userData={userData} 
                        showNotification={showNotification}
                    />
                </main>
            </div>
        </div>
    );
}

// --- Authentication Components ---
function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await logAction(userCredential.user, 'login');
        } catch (err) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">BlackOffice Jimiko</h2>
                <p className="text-center text-gray-600">จัดการรายรับ-รายจ่าย และตารางงาน</p>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">อีเมล</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 block">รหัสผ่าน</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded mt-1 focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <button type="submit" className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            เข้าสู่ระบบ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Layout Components ---
function Sidebar({ currentPage, setCurrentPage, userRole, isSidebarOpen, setIsSidebarOpen }) {
    const navItems = [
        { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, roles: ['staff', 'admin', 'owner'] },
        { id: 'finance', label: 'รายรับ-รายจ่าย', icon: DollarSign, roles: ['staff', 'admin', 'owner'] },
        { id: 'calendar', label: 'ปฏิทินงาน', icon: Calendar, roles: ['staff', 'admin', 'owner'] },
        { id: 'reports', label: 'รายงาน', icon: BarChart2, roles: ['admin', 'owner'] },
        { id: 'settings', label: 'ตั้งค่า', icon: Settings, roles: ['admin', 'owner'] },
        { id: 'profile', label: 'โปรไฟล์', icon: User, roles: ['staff', 'admin', 'owner'] },
        { id: 'logs', label: 'ประวัติการใช้งาน', icon: History, roles: ['owner'] },
    ];
    
    return (
        <aside className={`bg-white text-gray-700 w-64 space-y-2 py-4 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-30 shadow-lg md:shadow-none`}>
            <div className="px-4 pb-4 border-b">
                <h1 className="text-xl font-bold text-indigo-600">BlackOffice</h1>
            </div>
            <nav className="flex-grow pt-2">
                {userRole ? navItems
                    .filter(item => item.roles.includes(userRole))
                    .map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(item.id);
                            setIsSidebarOpen(false);
                        }}
                        className={`flex items-center py-2.5 px-4 rounded transition duration-200 ${currentPage === item.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100'}`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                    </a>
                )) : <div className="p-4 text-sm text-gray-500">กำลังโหลดเมนู...</div> }
            </nav>
        </aside>
    );
}

function Header({ user, userData, handleLogout, setIsSidebarOpen }) {
    return (
        <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
             <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 focus:outline-none md:hidden">
                <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-gray-800 hidden md:block">
                {/* Placeholder for page title if needed */}
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <p className="font-semibold">{userData?.displayName || user?.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{userData?.role}</p>
                </div>
                 <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={userData?.photoURL || `https://placehold.co/40x40/E2E8F0/4A5568?text=${(userData?.displayName || 'U').charAt(0)}`}
                    alt="โปรไฟล์"
                />
                <button onClick={handleLogout} className="text-gray-500 hover:text-indigo-600">
                    <LogOut className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
}

function PageContent({ page, user, userData, showNotification }) {
    if (!userData) {
         return <div className="flex items-center justify-center h-full"><div className="text-xl font-semibold">กำลังโหลดข้อมูลผู้ใช้...</div></div>;
    }
    switch (page) {
        case 'dashboard':
            return <DashboardPage user={user} />;
        case 'finance':
            return <FinancePage user={user} userData={userData}/>;
        case 'calendar':
            return <CalendarPage user={user} userData={userData}/>;
        case 'reports':
            return <ReportsPage user={user} />;
        case 'settings':
            return <SettingsPage user={user} userData={userData} showNotification={showNotification} />;
        case 'profile':
            return <ProfilePage user={user} userData={userData}/>;
        case 'logs':
            return <LogsPage />;
        default:
            return <div>Page not found</div>;
    }
}


// --- Page Components ---

function DashboardPage({ user }) {
    const [summary, setSummary] = useState({ income: 0, expense: 0, events: 0 });

    useEffect(() => {
        const finPath = `/artifacts/${appId}/public/data/finances`;
        const eventsPath = `/artifacts/${appId}/public/data/events`;
        
        const unsubFin = onSnapshot(query(collection(db, finPath)), (snapshot) => {
             let totalIncome = 0, totalExpense = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                if(data.type === 'income') totalIncome += data.amount;
                else totalExpense += data.amount;
            });
            setSummary(prev => ({ ...prev, income: totalIncome, expense: totalExpense }));
        });

        const unsubEvents = onSnapshot(query(collection(db, eventsPath)), (snapshot) => {
            setSummary(prev => ({ ...prev, events: snapshot.size }));
        });
        
        return () => {
            unsubFin();
            unsubEvents();
        };
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">แดชบอร์ด</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                           <DollarSign />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">รายรับทั้งหมด</p>
                            <p className="text-2xl font-semibold">{formatCurrency(summary.income)}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-red-100 text-red-600">
                           <DollarSign />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">รายจ่ายทั้งหมด</p>
                            <p className="text-2xl font-semibold">{formatCurrency(summary.expense)}</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                           <Calendar />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm text-gray-500">กิจกรรมในปฏิทิน</p>
                            <p className="text-2xl font-semibold">{summary.events} รายการ</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinancePage({ user, userData }) {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;
    const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;

    useEffect(() => {
        const q = query(collection(db, financeCollectionPath), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(transData);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const q = query(collection(db, categoriesCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const catData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(catData);
        });
        return unsubscribe;
    }, []);

    const handleAdd = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteDoc(doc(db, financeCollectionPath, itemToDelete));
            await logAction(user, 'delete_transaction', { transactionId: itemToDelete });
            setItemToDelete(null);
            setShowConfirmModal(false);
        }
    };

    return (
        <div>
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบ"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                confirmText="ยืนยันการลบ"
            />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">รายรับ-รายจ่าย</h2>
                <button onClick={handleAdd} className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    เพิ่มรายการ
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">วันที่</th>
                            <th className="p-2">หมวดหมู่</th>
                            <th className="p-2">รายละเอียด</th>
                            <th className="p-2 text-right">จำนวนเงิน</th>
                            <th className="p-2">ประเภท</th>
                            <th className="p-2">ไฟล์แนบ</th>
                            <th className="p-2 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{formatDate(t.date)}</td>
                                <td className="p-2">{t.category}</td>
                                <td className="p-2">{t.description}</td>
                                <td className="p-2 text-right">{formatCurrency(t.amount)}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {t.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                                    </span>
                                </td>
                                <td className="p-2">
                                    {t.fileURL && <a href={t.fileURL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline"><FileText className="w-5 h-5"/></a>}
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleEdit(t)} className="text-gray-500 hover:text-indigo-600 p-1"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDeleteClick(t.id)} className="text-gray-500 hover:text-red-600 p-1"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (
                <FinanceModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    transaction={editingTransaction}
                    categories={categories}
                    user={user}
                />
            )}
        </div>
    );
}

function FinanceModal({ isOpen, setIsOpen, transaction, categories, user }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    
    const financeCollectionPath = `/artifacts/${appId}/public/data/finances`;

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmount(transaction.amount);
            setCategory(transaction.category);
            setDescription(transaction.description);
            setDate(new Date(transaction.date.seconds * 1000).toISOString().slice(0, 10));
        } else {
            setType('expense');
            setAmount('');
            setCategory(categories.length > 0 ? categories[0].name : '');
            setDescription('');
            setDate(new Date().toISOString().slice(0, 10));
        }
    }, [transaction, categories, isOpen]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(selectedFile.type)) {
                setError('ไฟล์ต้องเป็น JPG, PNG, หรือ PDF เท่านั้น');
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
                setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
                return;
            }
            setError('');
            setFile(selectedFile);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        setError('');

        let fileURL = transaction?.fileURL || '';
        if (file) {
            const storageRef = ref(storage, `attachments/${user.uid}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            try {
                await uploadTask;
                fileURL = await getDownloadURL(uploadTask.snapshot.ref);
            } catch (err) {
                console.error("Upload failed", err);
                setError('อัปโหลดไฟล์ล้มเหลว');
                setUploading(false);
                return;
            }
        }

        const transactionData = {
            type,
            amount: parseFloat(amount),
            category,
            description,
            date: Timestamp.fromDate(new Date(date)),
            userId: user.uid,
            fileURL,
            updatedAt: Timestamp.now()
        };

        try {
            if (transaction) {
                const docRef = doc(db, financeCollectionPath, transaction.id);
                await updateDoc(docRef, transactionData);
                await logAction(user, 'update_transaction', { transactionId: transaction.id, ...transactionData });
            } else {
                const docRef = await addDoc(collection(db, financeCollectionPath), { ...transactionData, createdAt: Timestamp.now() });
                await logAction(user, 'create_transaction', { transactionId: docRef.id, ...transactionData });
            }
            setIsOpen(false);
        } catch (err) {
            console.error("Firestore operation failed", err);
            setError('บันทึกข้อมูลล้มเหลว');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h3>
                    <button onClick={() => setIsOpen(false)}><X className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            <option value="income">รายรับ</option>
                            <option value="expense">รายจ่าย</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">จำนวนเงิน</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ไฟล์แนบ (JPG, PNG, PDF ไม่เกิน 5MB)</label>
                        <input type="file" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        {file && <p className="text-sm text-gray-500 mt-1">{file.name}</p>}
                        {transaction?.fileURL && !file && <a href={transaction.fileURL} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">ดูไฟล์ปัจจุบัน</a>}
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={() => setIsOpen(false)} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">ยกเลิก</button>
                        <button type="submit" disabled={uploading} className="py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
                            {uploading ? 'กำลังบันทึก...' : 'บันทึก'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CalendarPage({user, userData}) {
    const [events, setEvents] = useState([]);
    const eventsCollectionPath = `/artifacts/${appId}/public/data/events`;

    useEffect(() => {
        const q = query(collection(db, eventsCollectionPath), orderBy('date', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        });
        return unsubscribe;
    }, []);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">ปฏิทินงาน</h2>
             <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">รายการกิจกรรมทั้งหมด</h3>
                <ul className="space-y-3">
                    {events.map(event => (
                        <li key={event.id} className="p-3 bg-gray-50 rounded-md border-l-4 border-indigo-500">
                           <p className="font-bold">{event.title}</p>
                           <p className="text-sm text-gray-600">{event.description}</p>
                           <p className="text-xs text-gray-500 mt-1">วันที่: {formatDate(event.date)}</p>
                        </li>
                    ))}
                    {events.length === 0 && <p className="text-gray-500">ยังไม่มีกิจกรรม</p>}
                </ul>
                <div className="mt-4">
                    <p className="text-sm text-gray-600">หมายเหตุ: ไม่มีการสร้างกิจกรรมซ้ำและการแจ้งเตือนอัตโนมัติ</p>
                </div>
             </div>
        </div>
    )
}

function ReportsPage({ user }) {
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
            const tDate = t.date.toDate();
            return tDate >= start && tDate <= end;
        });
        setFilteredData(filtered);
    }, [dateRange, transactions]);

    const handleDateChange = (e) => {
        setDateRange({ ...dateRange, [e.target.name]: e.target.value });
    };

    const exportToCSV = () => {
        let csvContent = "\uFEFF" + "data:text/csv;charset=utf-8,";
        csvContent += "วันที่,ประเภท,หมวดหมู่,รายละเอียด,จำนวนเงิน\n";
        
        filteredData.forEach(row => {
            const date = formatDate(row.date);
            const type = row.type === 'income' ? 'รายรับ' : 'รายจ่าย';
            const line = `"${date}","${type}","${row.category}","${row.description}",${row.amount}\n`;
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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">รายงานและกราฟ</h2>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
                        <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="mt-1 p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
                        <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="mt-1 p-2 border rounded-md"/>
                    </div>
                    <div className="self-end pt-5">
                        <button onClick={exportToCSV} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
                            Export to CSV
                        </button>
                    </div>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-lg text-green-600 font-semibold">รายรับรวม</p>
                    <p className="text-3xl font-bold">{formatCurrency(summary.income)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-lg text-red-600 font-semibold">รายจ่ายรวม</p>
                    <p className="text-3xl font-bold">{formatCurrency(summary.expense)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-lg text-indigo-600 font-semibold">คงเหลือ</p>
                    <p className="text-3xl font-bold">{formatCurrency(summary.income - summary.expense)}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                 <h3 className="text-lg font-semibold mb-4">กราฟสรุป</h3>
                 <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-md">
                    <p className="text-gray-500">ส่วนแสดงกราฟ (ยังไม่ถูกพัฒนา)</p>
                 </div>
            </div>
        </div>
    );
}

function SettingsPage({ user, userData, showNotification }) {
    if (userData.role !== 'admin' && userData.role !== 'owner') {
        return <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    }
    const [currentTab, setCurrentTab] = useState('categories');
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">ตั้งค่าระบบ</h2>
            <div className="flex border-b mb-4">
                <button onClick={() => setCurrentTab('categories')} className={`py-2 px-4 ${currentTab === 'categories' ? 'border-b-2 border-indigo-500 font-semibold' : 'text-gray-500'}`}>
                    จัดการหมวดหมู่
                </button>
                {userData.role === 'owner' && (
                    <button onClick={() => setCurrentTab('users')} className={`py-2 px-4 ${currentTab === 'users' ? 'border-b-2 border-indigo-500 font-semibold' : 'text-gray-500'}`}>
                        จัดการผู้ใช้งาน
                    </button>
                )}
            </div>

            {currentTab === 'categories' && <CategorySettings user={user} />}
            {currentTab === 'users' && userData.role === 'owner' && <UserSettings user={user} showNotification={showNotification} />}
        </div>
    );
}

function CategorySettings({ user }) {
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const categoriesCollectionPath = `/artifacts/${appId}/public/data/categories`;

    useEffect(() => {
        const q = query(collection(db, categoriesCollectionPath));
        const unsubscribe = onSnapshot(q, snapshot => {
            setCategories(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsubscribe;
    }, []);

    const handleAddCategory = async () => {
        if (newCategoryName.trim() === '') return;
        const newCategory = { name: newCategoryName.trim(), createdAt: Timestamp.now() };
        const docRef = await addDoc(collection(db, categoriesCollectionPath), newCategory);
        await logAction(user, 'create_category', { categoryId: docRef.id, name: newCategory.name });
        setNewCategoryName('');
    };

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteDoc(doc(db, categoriesCollectionPath, itemToDelete));
            await logAction(user, 'delete_category', { categoryId: itemToDelete });
            setItemToDelete(null);
            setShowConfirmModal(false);
        }
    };


    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmDelete}
                title="ยืนยันการลบ"
                message="คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?"
                confirmText="ยืนยันการลบ"
            />
            <h3 className="text-lg font-semibold mb-3">หมวดหมู่รายรับ-รายจ่าย</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="ชื่อหมวดหมู่ใหม่"
                    className="flex-grow p-2 border rounded-md"
                />
                <button onClick={handleAddCategory} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">เพิ่ม</button>
            </div>
            <ul className="space-y-2">
                {categories.map(cat => (
                    <li key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{cat.name}</span>
                        <button onClick={() => handleDeleteClick(cat.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function UserSettings({ user, showNotification }) {
    const [users, setUsers] = useState([]);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = useCallback(async () => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const unsubscribePromise = fetchUsers();
        return () => {
             unsubscribePromise.then(unsub => unsub());
        }
    }, [fetchUsers]);

    const handleRoleChange = async (targetUserId, newRole) => {
        if(user.uid === targetUserId) {
            showNotification("ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้", 'error');
            return;
        }
        const userDocRef = doc(db, 'users', targetUserId);
        await updateDoc(userDocRef, { role: newRole });
        await logAction(user, 'permission_change', { targetUserId, newRole });
        showNotification("เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ");
    };

    const handleResetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            await logAction(user, 'reset_password_request', { targetEmail: email });
            showNotification(`ส่งอีเมลรีเซ็ตรหัสผ่านไปที่ ${email} แล้ว`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            showNotification("เกิดข้อผิดพลาดในการส่งอีเมล", 'error');
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        
        const deleteUserFunc = httpsCallable(functions, 'deleteUser');
        try {
            await deleteUserFunc({ uid: userToDelete.id });
            await logAction(user, 'delete_user_success', { targetUserId: userToDelete.id, targetEmail: userToDelete.email });
            showNotification(`ลบผู้ใช้ ${userToDelete.email} สำเร็จ`);
            setUserToDelete(null);
        } catch(error) {
            console.error("Error deleting user:", error);
            showNotification(error.message || "เกิดข้อผิดพลาดในการลบผู้ใช้", 'error');
            setUserToDelete(null);
        }
    };
    
    return (
        <div className="bg-white p-4 rounded-lg shadow">
            {isAddUserModalOpen && (
                <AddUserModal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    showNotification={showNotification}
                    currentUser={user}
                />
            )}
            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDeleteUser}
                title="ยืนยันการลบผู้ใช้"
                message={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ ${userToDelete?.email} ออกจากระบบทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้`}
                confirmText="ยืนยันการลบ"
            />
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">รายชื่อผู้ใช้งานในระบบ</h3>
                <button onClick={() => setIsAddUserModalOpen(true)} className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                    <UserPlus className="w-5 h-5 mr-2" />
                    เพิ่มผู้ใช้ใหม่
                </button>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">อีเมล</th>
                            <th className="p-2">ชื่อ</th>
                            <th className="p-2">สิทธิ์</th>
                            <th className="p-2 text-center">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-2">{u.email}</td>
                                <td className="p-2">{u.displayName}</td>
                                <td className="p-2">
                                     <select 
                                        value={u.role} 
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)} 
                                        className="p-1 border rounded-md bg-white disabled:bg-gray-100"
                                        disabled={user.uid === u.id || u.role === 'owner'}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-2 text-center space-x-2">
                                    <button 
                                        onClick={() => handleResetPassword(u.email)} 
                                        className="text-gray-500 hover:text-blue-600 p-1 disabled:opacity-50"
                                        title="รีเซ็ตรหัสผ่าน"
                                        disabled={user.uid === u.id}
                                    >
                                        <KeyRound className="w-4 h-4"/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(u)} 
                                        className="text-gray-500 hover:text-red-600 p-1 disabled:opacity-50"
                                        title="ลบผู้ใช้"
                                        disabled={user.uid === u.id || u.role === 'owner'}
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AddUserModal({ isOpen, onClose, showNotification, currentUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState('staff');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const createUserFunc = httpsCallable(functions, 'createUser');
        try {
            const result = await createUserFunc({
                email,
                password,
                displayName,
                role
            });

            if (result.data.success) {
                await logAction(currentUser, 'create_user_success', { newUserEmail: email, role: role });
                showNotification(`สร้างผู้ใช้ ${email} สำเร็จ`);
                onClose();
            } else {
                 throw new Error(result.data.error.message || 'An unknown error occurred.');
            }
        } catch (err) {
            console.error("Error calling createUser function:", err);
            setError(err.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้");
            showNotification(err.message || "เกิดข้อผิดพลาด", 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">เพิ่มผู้ใช้ใหม่</h3>
                    <button onClick={onClose}><X className="w-6 h-6"/></button>
                </div>
                 <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">อีเมล</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">รหัสผ่านชั่วคราว (อย่างน้อย 6 ตัวอักษร)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">ชื่อที่แสดง</label>
                        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">สิทธิ์การใช้งาน</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="mt-1 w-full p-2 border rounded bg-white">
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg">ยกเลิก</button>
                        <button type="submit" disabled={isLoading} className="py-2 px-4 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300">
                             {isLoading ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function ProfilePage({ user, userData }) {
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
            setMessage('อัปเดตโปรไฟล์สำเร็จ');
        } catch(error) {
            console.error(error);
            setMessage('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword !== confirmPassword) {
            setMessage('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }
        if (newPassword.length < 6) {
            setMessage('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            await logAction(user, 'change_password');
            setMessage('เปลี่ยนรหัสผ่านสำเร็จ');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error(error);
            setMessage('เกิดข้อผิดพลาด: รหัสผ่านปัจจุบันอาจไม่ถูกต้อง');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">โปรไฟล์ของฉัน</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">ข้อมูลส่วนตัว</h3>
                    <div className="text-center mb-4">
                        <img 
                            className="w-24 h-24 rounded-full mx-auto object-cover"
                            src={userData?.photoURL || `https://placehold.co/96x96/E2E8F0/4A5568?text=${(userData?.displayName || 'U').charAt(0)}`}
                            alt="Profile"
                        />
                    </div>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ชื่อที่แสดง</label>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">เปลี่ยนรูปโปรไฟล์</label>
                            <input type="file" onChange={e => setPhoto(e.target.files[0])} accept="image/png, image/jpeg" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                        </div>
                         <button type="submit" disabled={isUploading} className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">
                             {isUploading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
                        </button>
                    </form>
                    <div className="mt-4 border-t pt-4">
                        <p><strong className="font-medium">อีเมล:</strong> {userData.email}</p>
                        <p><strong className="font-medium">สิทธิ์การใช้งาน:</strong> <span className="capitalize">{userData.role}</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">เปลี่ยนรหัสผ่าน</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                         <button type="submit" className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800">เปลี่ยนรหัสผ่าน</button>
                    </form>
                </div>
            </div>
            {message && <div className="mt-4 p-3 rounded-md bg-blue-100 text-blue-800">{message}</div>}
        </div>
    );
}

function LogsPage() {
    const [logs, setLogs] = useState([]);
    const logCollectionPath = `/artifacts/${appId}/public/data/logs`;

    useEffect(() => {
        const q = query(collection(db, logCollectionPath), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, []);

    const formatAction = (action) => {
        const actions = {
            login: 'เข้าสู่ระบบ',
            logout: 'ออกจากระบบ',
            create_transaction: 'สร้างรายการการเงิน',
            update_transaction: 'อัปเดตรายการการเงิน',
            delete_transaction: 'ลบรายการการเงิน',
            create_category: 'สร้างหมวดหมู่',
            delete_category: 'ลบหมวดหมู่',
            permission_change: 'เปลี่ยนสิทธิ์ผู้ใช้',
            update_profile: 'อัปเดตโปรไฟล์',
            change_password: 'เปลี่ยนรหัสผ่าน',
            export_report_csv: 'ส่งออกรายงาน CSV',
            reset_password_request: 'ส่งคำขอรีเซ็ตรหัสผ่าน',
            delete_user: 'ลบบัญชีผู้ใช้ (Firestore)',
            create_user_record: 'สร้างข้อมูลผู้ใช้ (Firestore)',
            create_user_success: 'สร้างผู้ใช้ใหม่สำเร็จ',
            delete_user_success: 'ลบผู้ใช้สำเร็จ'
        };
        return actions[action] || action;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">ประวัติการใช้งานระบบ</h2>
            <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">เวลา</th>
                            <th className="p-2">ผู้ใช้งาน</th>
                            <th className="p-2">การกระทำ</th>
                            <th className="p-2">รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 whitespace-nowrap">{new Date(log.timestamp.seconds * 1000).toLocaleString('th-TH')}</td>
                                <td className="p-2">{log.userEmail}</td>
                                <td className="p-2">{formatAction(log.action)}</td>
                                <td className="p-2 text-sm text-gray-600 break-all">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
