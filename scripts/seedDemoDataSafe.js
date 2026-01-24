import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc, setDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAznWgXGoNaNSas-Oq5H9WZW9lbTAqpSr8",
    authDomain: "attendance-f1ad8.firebaseapp.com",
    projectId: "attendance-f1ad8",
    storageBucket: "attendance-f1ad8.firebasestorage.app",
    messagingSenderId: "1049213979536",
    appId: "1:1049213979536:web:0c30c41b29b5d821e5c115",
    measurementId: "G-2YE2NB2QW8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const demoEmployees = [
    {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@demo.com",
        role: "Senior Developer",
        salary: "₹85,000",
        phone: "+91 98765 43210",
        address: "123 MG Road, Bangalore, Karnataka 560001",
        bankDetails: {
            accountNumber: "1234567890",
            ifscCode: "SBIN0001234",
            bankName: "State Bank of India",
            branch: "MG Road Branch"
        }
    },
    {
        name: "Priya Sharma",
        email: "priya.sharma@demo.com",
        role: "UI/UX Designer",
        salary: "₹65,000",
        phone: "+91 98765 43211",
        address: "456 Park Street, Mumbai, Maharashtra 400001",
        bankDetails: {
            accountNumber: "2345678901",
            ifscCode: "HDFC0002345",
            bankName: "HDFC Bank",
            branch: "Park Street Branch"
        }
    },
    {
        name: "Amit Patel",
        email: "amit.patel@demo.com",
        role: "Project Manager",
        salary: "₹1,20,000",
        phone: "+91 98765 43212",
        address: "789 Ring Road, Ahmedabad, Gujarat 380001",
        bankDetails: {
            accountNumber: "3456789012",
            ifscCode: "ICIC0003456",
            bankName: "ICICI Bank",
            branch: "Ring Road Branch"
        }
    },
    {
        name: "Sneha Reddy",
        email: "sneha.reddy@demo.com",
        role: "HR Manager",
        salary: "₹75,000",
        phone: "+91 98765 43213",
        address: "321 Jubilee Hills, Hyderabad, Telangana 500033",
        bankDetails: {
            accountNumber: "4567890123",
            ifscCode: "AXIS0004567",
            bankName: "Axis Bank",
            branch: "Jubilee Hills Branch"
        }
    },
    {
        name: "Vikram Singh",
        email: "vikram.singh@demo.com",
        role: "DevOps Engineer",
        salary: "₹90,000",
        phone: "+91 98765 43214",
        address: "654 Civil Lines, Delhi 110054",
        bankDetails: {
            accountNumber: "5678901234",
            ifscCode: "SBIN0005678",
            bankName: "State Bank of India",
            branch: "Civil Lines Branch"
        }
    },
    {
        name: "Anita Desai",
        email: "anita.desai@demo.com",
        role: "QA Engineer",
        salary: "₹55,000",
        phone: "+91 98765 43215",
        address: "987 Deccan, Pune, Maharashtra 411001",
        bankDetails: {
            accountNumber: "6789012345",
            ifscCode: "HDFC0006789",
            bankName: "HDFC Bank",
            branch: "Deccan Branch"
        }
    },
    {
        name: "Karthik Iyer",
        email: "karthik.iyer@demo.com",
        role: "Backend Developer",
        salary: "₹70,000",
        phone: "+91 98765 43216",
        address: "147 T Nagar, Chennai, Tamil Nadu 600017",
        bankDetails: {
            accountNumber: "7890123456",
            ifscCode: "ICIC0007890",
            bankName: "ICICI Bank",
            branch: "T Nagar Branch"
        }
    },
    {
        name: "Neha Gupta",
        email: "neha.gupta@demo.com",
        role: "Frontend Developer",
        salary: "₹68,000",
        phone: "+91 98765 43217",
        address: "258 Sector 18, Noida, Uttar Pradesh 201301",
        bankDetails: {
            accountNumber: "8901234567",
            ifscCode: "AXIS0008901",
            bankName: "Axis Bank",
            branch: "Sector 18 Branch"
        }
    },
    {
        name: "Arjun Mehta",
        email: "arjun.mehta@demo.com",
        role: "Data Analyst",
        salary: "₹60,000",
        phone: "+91 98765 43218",
        address: "369 Salt Lake, Kolkata, West Bengal 700091",
        bankDetails: {
            accountNumber: "9012345678",
            ifscCode: "SBIN0009012",
            bankName: "State Bank of India",
            branch: "Salt Lake Branch"
        }
    },
    {
        name: "Pooja Nair",
        email: "pooja.nair@demo.com",
        role: "Marketing Executive",
        salary: "₹50,000",
        phone: "+91 98765 43219",
        address: "741 Marine Drive, Kochi, Kerala 682031",
        bankDetails: {
            accountNumber: "0123456789",
            ifscCode: "HDFC0000123",
            bankName: "HDFC Bank",
            branch: "Marine Drive Branch"
        }
    }
];

async function cleanDatabase() {
    console.log("🗑️  Cleaning existing data...");

    try {
        // Clean staff collection
        const staffSnapshot = await getDocs(collection(db, 'staff'));
        console.log(`   Deleting ${staffSnapshot.docs.length} staff records...`);
        for (const docSnap of staffSnapshot.docs) {
            await deleteDoc(doc(db, 'staff', docSnap.id));
        }

        // Clean users collection
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log(`   Deleting ${usersSnapshot.docs.length} user documents...`);
        for (const docSnap of usersSnapshot.docs) {
            await deleteDoc(doc(db, 'users', docSnap.id));
        }

        // Clean attendance collection
        const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
        console.log(`   Deleting ${attendanceSnapshot.docs.length} attendance records...`);
        for (const docSnap of attendanceSnapshot.docs) {
            await deleteDoc(doc(db, 'attendance', docSnap.id));
        }

        console.log("✅ Database cleaned successfully!\n");
    } catch (error) {
        console.error("❌ Error cleaning database:", error);
        throw error;
    }
}

async function getOrCreateAuthUser(email, password) {
    try {
        // Try to create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { uid: userCredential.user.uid, isNew: true };
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            // User exists, sign in to get UID
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                return { uid: userCredential.user.uid, isNew: false };
            } catch (signInError) {
                console.error(`   ⚠️  Could not sign in with existing credentials. Password might be different.`);
                throw signInError;
            }
        }
        throw error;
    }
}

async function createDemoData() {
    console.log("👥 Creating 10 demo employees...\n");

    const defaultPassword = "Demo@123";
    let created = 0;
    let updated = 0;

    for (let i = 0; i < demoEmployees.length; i++) {
        const employee = demoEmployees[i];
        console.log(`${i + 1}. Processing ${employee.name}...`);

        try {
            // Get or create Firebase Auth user
            const { uid, isNew } = await getOrCreateAuthUser(employee.email, defaultPassword);

            if (isNew) {
                console.log(`   ✓ New auth user created (UID: ${uid})`);
                created++;
            } else {
                console.log(`   ✓ Using existing auth user (UID: ${uid})`);
                updated++;
            }

            // Create staff record with uid
            await addDoc(collection(db, 'staff'), {
                name: employee.name,
                email: employee.email,
                role: employee.role,
                uid: uid,
                salary: employee.salary,
                phone: employee.phone,
                address: employee.address,
                bankDetails: employee.bankDetails,
                ruleSetId: 'default',
                attendanceLocationId: null,
                attendanceLocation: null,
                joinedAt: new Date().toISOString(),
                status: 'active'
            });
            console.log(`   ✓ Staff record created`);

            // Create/update user document
            await setDoc(doc(db, 'users', uid), {
                email: employee.email,
                name: employee.name,
                role: employee.role,
                createdAt: new Date().toISOString()
            }, { merge: true });
            console.log(`   ✓ User document ${isNew ? 'created' : 'updated'}\n`);

        } catch (error) {
            console.error(`   ❌ Error:`, error.message, '\n');
        }
    }

    console.log("✅ Demo data creation completed!\n");
    console.log(`📊 Summary: ${created} new users created, ${updated} existing users updated\n`);
    console.log("📋 Login credentials for all employees:");
    console.log("   Password: Demo@123");
    console.log("\n📧 Employee emails:");
    demoEmployees.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.email}`);
    });
}

async function main() {
    console.log("🚀 Starting demo data seed script (Safe Mode)...\n");

    try {
        await cleanDatabase();
        await createDemoData();

        console.log("\n✨ All done! Your database is now populated with demo data.\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Script failed:", error);
        process.exit(1);
    }
}

main();
