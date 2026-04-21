import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Investment, Transaction, ReferralData } from './investmentService'

const FIREBASE_ENABLED = !!import.meta.env.VITE_FIREBASE_PROJECT_ID

function getUserId(): string {
  const wallet = localStorage.getItem('ton_wallet_address')
  return wallet || 'default_user'
}

export function isFirebaseEnabled(): boolean {
  return FIREBASE_ENABLED
}

export async function getInvestmentsFromFirestore(): Promise<Investment[]> {
  if (!FIREBASE_ENABLED) return []
  try {
    const userId = getUserId()
    const q = query(
      collection(db, 'investments'),
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Investment))
  } catch {
    return []
  }
}

export async function saveInvestmentToFirestore(investment: Investment) {
  if (!FIREBASE_ENABLED) return
  try {
    const userId = getUserId()
    await addDoc(collection(db, 'investments'), {
      ...investment,
      userId,
      createdAt: Timestamp.now(),
    })
  } catch {
    // fallback handled by localStorage service
  }
}

export async function getTransactionsFromFirestore(): Promise<Transaction[]> {
  if (!FIREBASE_ENABLED) return []
  try {
    const userId = getUserId()
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Transaction))
  } catch {
    return []
  }
}

export async function saveTransactionToFirestore(tx: Transaction) {
  if (!FIREBASE_ENABLED) return
  try {
    const userId = getUserId()
    await addDoc(collection(db, 'transactions'), {
      ...tx,
      userId,
      createdAt: Timestamp.now(),
    })
  } catch {
    // fallback
  }
}

export async function getReferralDataFromFirestore(): Promise<ReferralData | null> {
  if (!FIREBASE_ENABLED) return null
  try {
    const userId = getUserId()
    const ref = doc(db, 'referrals', userId)
    const snap = await getDoc(ref)
    if (snap.exists()) return snap.data() as ReferralData
    return null
  } catch {
    return null
  }
}

export async function saveReferralDataToFirestore(data: ReferralData) {
  if (!FIREBASE_ENABLED) return
  try {
    const userId = getUserId()
    const ref = doc(db, 'referrals', userId)
    await setDoc(ref, { ...data, userId, updatedAt: Timestamp.now() })
  } catch {
    // fallback
  }
}

export async function addReferralToFirestore(referralUserId: string, inviterCode: string) {
  if (!FIREBASE_ENABLED) return
  try {
    const q = query(collection(db, 'referrals'), where('code', '==', inviterCode))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return
    const docRef = snapshot.docs[0].ref
    const data = snapshot.docs[0].data() as ReferralData
    const newReferral = {
      id: referralUserId,
      username: 'User',
      joinedAt: new Date().toISOString(),
      investedAmount: 0,
      earnedCommission: 0,
    }
    await updateDoc(docRef, {
      referrals: [...data.referrals, newReferral],
      referralCount: data.referralCount + 1,
    })
  } catch {
    // fallback
  }
}
