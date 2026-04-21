// ============================================
// TechOL — Auth Service (Production-Grade v2)
// Seamless Google Auth + Redirect Fallback
// ============================================
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    updateProfile as fbUpdateProfile,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    browserLocalPersistence,
    setPersistence
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase-config.js";

const AuthService = {
    currentUser: null,
    initialized: false,
    _authListenerSetup: false,

    // Human-readable error messages for Firebase auth codes
    _errorMessages: {
        'auth/user-not-found': 'No account found with this email. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check and try again.',
        'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
        'auth/weak-password': 'Password must be at least 6 characters long.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
        'auth/popup-blocked': 'Pop-up was blocked by your browser. Trying redirect method...',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
        'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
        'auth/requires-recent-login': 'Please log in again to perform this action.',
    },

    _humanizeError(error) {
        const code = error?.code || '';
        return this._errorMessages[code] || error?.message || 'An unexpected error occurred. Please try again.';
    },

    /**
     * Initialize auth — sets persistence to LOCAL.
     * Also checks for redirect results from Google sign-in fallback.
     */
    async init() {
        if (this.initialized) return this.currentUser;
        try {
            await setPersistence(auth, browserLocalPersistence);
            
            // Check for redirect result (Google auth fallback)
            try {
                const redirectResult = await getRedirectResult(auth);
                if (redirectResult?.user) {
                    console.log('Auth: Redirect result found, hydrating user...');
                    await this._ensureUserDoc(redirectResult.user);
                    await this.updateUserInfo(redirectResult.user);
                }
            } catch (redirectErr) {
                // Only warn if it's not the expected "no redirect" case
                if (redirectErr.code !== 'auth/no-redirect-result') {
                    console.warn('Auth: Redirect check failed', redirectErr);
                }
            }
            
            this.initialized = true;
        } catch (e) {
            console.warn('Auth: setPersistence failed', e);
        }
        return this.currentUser;
    },

    /**
     * Hydrate user data from Firebase Auth + Firestore
     */
    async updateUserInfo(user) {
        let extra = {};
        try {
            const lastUpdate = localStorage.getItem('techol_last_db_sync');
            const now = Date.now();
            // Fetch from Firestore if cache is stale (>5 min)
            if (!lastUpdate || (now - parseInt(lastUpdate)) > 300000) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    extra = userDoc.data();
                    localStorage.setItem('techol_last_db_sync', now.toString());
                    localStorage.setItem('techol_user_profile_' + user.uid, JSON.stringify(extra));
                }
            } else {
                extra = JSON.parse(localStorage.getItem('techol_user_profile_' + user.uid) || '{}');
            }
        } catch (e) { console.warn('Auth: DB Sync error', e); }

        this.currentUser = {
            uid: user.uid,
            email: user.email,
            phoneNumber: user.phoneNumber,
            displayName: extra.displayName || user.displayName || user.email?.split('@')[0] || 'User',
            username: extra.username || user.email?.split('@')[0] || 'user_' + user.uid.slice(0, 5),
            photoURL: extra.photoURL || user.photoURL || null,
            bio: extra.bio || '',
            location: extra.location || '',
            website: extra.website || '',
            followers: extra.followers || 0,
            following: extra.following || 0,
            joinedDate: extra.createdAt || new Date().toISOString()
        };
        localStorage.setItem('techol_user', JSON.stringify(this.currentUser));
    },

    getUser() { return this.currentUser; },

    /**
     * Email/Password Sign Up
     * Creates user, sets profile, returns immediately — NO re-init
     */
    async signUp(email, password, name, username) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await fbUpdateProfile(result.user, { displayName: name });
        this.currentUser = {
            uid: result.user.uid,
            email: result.user.email,
            displayName: name,
            username: username || email.split('@')[0],
            photoURL: null, bio: '', location: '', website: '',
            followers: 0, following: 0, joinedDate: new Date().toISOString()
        };
        localStorage.setItem('techol_user', JSON.stringify(this.currentUser));
        // Fire-and-forget Firestore write (non-blocking)
        setDoc(doc(db, 'users', result.user.uid), this.currentUser).catch(() => { });
        return result.user;
    },

    /**
     * Email/Password Sign In
     * Signs in and hydrates user data, returns immediately — NO re-init
     */
    async signIn(email, password) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        // Hydrate user data immediately (don't wait for onAuthStateChanged)
        await this.updateUserInfo(result.user);
        return result.user;
    },

    /**
     * Google Sign In — Popup with automatic Redirect fallback
     * Handles popup blockers seamlessly
     */
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        try {
            // Try popup first (fastest UX)
            const result = await signInWithPopup(auth, provider);
            // Ensure user doc exists in Firestore
            await this._ensureUserDoc(result.user);
            await this.updateUserInfo(result.user);
            return result;
        } catch (popupError) {
            // If popup was blocked or cancelled, fall back to redirect
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/cancelled-popup-request') {
                console.log('Auth: Popup blocked, falling back to redirect...');
                // Mark that we're doing a redirect so the app knows to wait
                localStorage.setItem('techol_auth_redirect_pending', 'true');
                await signInWithRedirect(auth, provider);
                // This line won't be reached — page will redirect
                return null;
            }
            throw popupError;
        }
    },

    /**
     * Ensure a Firestore user document exists for the given auth user.
     * Creates one if it doesn't exist (for Google/phone sign-ups).
     */
    async _ensureUserDoc(user) {
        if (!user?.uid) return;
        try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                const newUserData = {
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    username: (user.email?.split('@')[0] || 'user_' + user.uid.slice(0, 5)).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                    photoURL: user.photoURL || null,
                    bio: '',
                    location: '',
                    website: '',
                    followers: 0,
                    following: 0,
                    sector: '',
                    createdAt: new Date().toISOString(),
                    joinedDate: new Date().toISOString()
                };
                await setDoc(userRef, newUserData);
                console.log('Auth: Created new user doc for', user.uid);
            }
        } catch (e) {
            console.warn('Auth: _ensureUserDoc failed (non-blocking)', e);
        }
    },

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        if (!email) throw new Error('Please enter your email address.');
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (e) {
            throw new Error(this._humanizeError(e));
        }
    },

    /**
     * Sign Out — clears all cached data
     */
    async signOut() {
        try { await signOut(auth); } catch (e) { }
        this.currentUser = null;
        localStorage.removeItem('techol_user');
        localStorage.removeItem('techol_last_db_sync');
    },

    async updateProfile(data) {
        if (!this.currentUser) return;
        Object.assign(this.currentUser, data);
        localStorage.setItem('techol_user', JSON.stringify(this.currentUser));
        localStorage.setItem('techol_user_profile_' + this.currentUser.uid, JSON.stringify(this.currentUser));
        try {
            const user = auth.currentUser;
            if (user && data.displayName) await fbUpdateProfile(user, { displayName: data.displayName });
            await setDoc(doc(db, 'users', this.currentUser.uid), this.currentUser, { merge: true });
        } catch (e) { }
    },

    async updateProfilePhoto(file) {
        if (!this.currentUser) throw new Error('Not logged in');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                this.currentUser.photoURL = dataUrl;
                localStorage.setItem('techol_user', JSON.stringify(this.currentUser));
                await this.updateProfile({ photoURL: dataUrl });
                resolve(dataUrl);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    setupRecaptcha(containerId = 'recaptcha-container') {
        if (this.recaptchaVerifier) return;
        try {
            // Standard invisible recaptcha setup
            this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                'size': 'invisible',
                'callback': () => { console.log('Recaptcha solved'); }
            });
        } catch (e) {
            console.warn('Recaptcha setup failed:', e);
            throw new Error('Security verification initialization failed.');
        }
    },

    async sendOtp(phoneNumber, containerId) {
        this.setupRecaptcha(containerId);
        try {
            // Set a timeout for the SMS request to prevent infinite waiting
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SMS Request Timed Out. Please check your network.')), 15000));

            const sendPromise = (async () => {
                this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
                return true;
            })();

            return await Promise.race([sendPromise, timeoutPromise]);
        } catch (e) {
            console.error('OTP Send error:', e);
            // Reset recaptcha on error so user can try again
            if (this.recaptchaVerifier) {
                this.recaptchaVerifier.clear();
                this.recaptchaVerifier = null;
            }
            throw e;
        }
    },

    async confirmOtp(code) {
        if (!this.confirmationResult) throw new Error('No active confirmation session found.');
        try {
            const result = await this.confirmationResult.confirm(code);
            await this.updateUserInfo(result.user);
            return result.user;
        } catch (e) {
            console.error('OTP Confirmation error:', e);
            throw new Error('Invalid or expired verification code.');
        }
    }
};

window.AuthService = AuthService;
export default AuthService;
