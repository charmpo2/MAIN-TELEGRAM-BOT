import { getReferralData, addReferral as addLocalReferral } from './investmentService'
import { addReferralToFirestore, isFirebaseEnabled } from './firestoreService'

const REFERRAL_PROCESSED_KEY = 'ton_referral_processed'

/**
 * Process a referral code when a new user joins
 * This should be called once when the app initializes
 */
export async function processReferralCode(referralCode: string | null, _userId: string, _username: string): Promise<boolean> {
  if (!referralCode) return false
  
  // Check if we already processed a referral for this user
  const processed = localStorage.getItem(REFERRAL_PROCESSED_KEY)
  if (processed) return false

  // Don't allow self-referral
  const myReferralData = getReferralData()
  if (myReferralData.code === referralCode) {
    console.log('Self-referral blocked')
    return false
  }

  try {
    // Store locally first
    localStorage.setItem('ton_referred_by', referralCode)
    localStorage.setItem(REFERRAL_PROCESSED_KEY, 'true')

    // Try to sync with Firebase if available
    if (isFirebaseEnabled()) {
      await addReferralToFirestore(_userId, referralCode)
    }

    console.log('Referral processed:', referralCode)
    return true
  } catch (error) {
    console.error('Failed to process referral:', error)
    return false
  }
}

/**
 * Get the referral code that was used to invite this user
 */
export function getReferredBy(): string | null {
  return localStorage.getItem('ton_referred_by')
}

/**
 * Credit commission to referrer when referred user makes a deposit
 */
export async function creditReferralCommission(referrerCode: string, amount: number, _userId: string, username: string): Promise<boolean> {
  if (!referrerCode || amount <= 0) return false

  const commission = amount * 0.05 // 5% commission

  try {
    // Add to local storage
    addLocalReferral(undefined, {
      username: `${username} (commission)`,
      investedAmount: amount,
      earnedCommission: commission,
      joinedAt: new Date().toISOString(),
    })

    // TODO: In production, this should update the referrer's balance in Firebase
    console.log(`Credited ${commission} TON commission to referrer ${referrerCode}`)
    return true
  } catch (error) {
    console.error('Failed to credit commission:', error)
    return false
  }
}

/**
 * Check if this is a new user joining via referral
 */
export function isNewReferral(): boolean {
  const processed = localStorage.getItem(REFERRAL_PROCESSED_KEY)
  const referredBy = localStorage.getItem('ton_referred_by')
  return !processed && !!referredBy
}

/**
 * Clear referral data (for testing)
 */
export function clearReferralData(): void {
  localStorage.removeItem(REFERRAL_PROCESSED_KEY)
  localStorage.removeItem('ton_referred_by')
}
