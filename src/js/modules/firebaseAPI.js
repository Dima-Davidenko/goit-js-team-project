import { FIREBASE_CONFIG } from '../utils/envConsts';
import { firebaseApp, initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { getDatabase, ref, set, remove, onValue } from 'firebase/database';
import refsMdl from './refsMdl';
import storageAPI from './storageAPI';

export default class firebaseAPI {
  constructor(signInBtnEl, logOutBtnEl) {
    this.firebaseConfig = JSON.parse(FIREBASE_CONFIG);
    this.firebaseApp = initializeApp(this.firebaseConfig);
    this.firebaseAuth = getAuth(firebaseApp);
    this.providerGoogle = new GoogleAuthProvider();
    this.database = getDatabase(this.firebaseApp);
    this.userStatus = refsMdl.userStatusEl;
    this.monitorAuthState();
    signInBtnEl.addEventListener('click', this.signInWithPopupGoogle.bind(this));
    logOutBtnEl.addEventListener('click', this.logout.bind(this));
  }

  async signInWithEmailLink() {
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      url: 'http://localhost:1234',
      // This must be true.
      handleCodeInApp: true,
    };
    const userEmail = refsMdl.emailInputEl.value.trim();
    console.log(userEmail);
    sendSignInLinkToEmail(this.firebaseAuth, userEmail, actionCodeSettings)
      .then(() => {
        // The link was successfully sent. Inform the user.
        // Save the email locally so you don't need to ask the user for it again
        // if they open the link on the same device.
        window.localStorage.setItem('emailForSignIn', userEmail);
        // ...
      })
      .catch(error => {
        console.log(error);
        const errorCode = error.code;
        const errorMessage = error.message;
        // ...
      });
  }
  async signInWithPopupGoogle() {
    try {
      const signInResult = await signInWithPopup(this.firebaseAuth, this.providerGoogle);
      // const credential = GoogleAuthProvider.credentialFromResult(signInResult);
      // const token = credential.accessToken;
      const user = signInResult.user;
      this.userId = user.uid;
      this.userStatus.textContent = `Hello, ${user.displayName}`;
      console.log(user);
    } catch (error) {
      // const errorCode = error.code;
      // const errorMessage = error.message;
      // The email of the user's account used.
      // const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      console.log(error);
      console.log(credential);
      console.log('error');
    }
  }

  async writeDataToStorage(lybrary) {
    storageAPI.save('lybrary', lybrary);
  }

  // Monitor auth state
  async monitorAuthState() {
    if (isSignInWithEmailLink(this.firebaseAuth, window.location.href)) {
      // Additional state parameters can also be passed via URL.
      // This can be used to continue the user's intended action before triggering
      // the sign-in operation.
      // Get the email if available. This should be available if the user completes
      // the flow on the same device where they started it.
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the associated email again. For example:
        email = window.prompt('Please provide your email for confirmation');
      }
      // The client SDK will parse the code from the link for you.
      await signInWithEmailLink(this.firebaseAuth, email, window.location.href)
        .then(result => {
          // Clear email from storage.
          window.localStorage.removeItem('emailForSignIn');
          window.location.replace(window.location.origin);
          // You can access the new user via result.user
          // Additional user info profile not available via:
          // result.additionalUserInfo.profile == null
          // You can check if the user is new or existing:
          // result.additionalUserInfo.isNewUser
        })
        .catch(error => {
          // Some error occurred, you can inspect the code: error.code
          // Common errors could be invalid email and invalid or expired OTPs.
        });
    }
    onAuthStateChanged(this.firebaseAuth, user => {
      if (user) {
        refsMdl.signOutBtnEl.classList.remove('is-hidden');
        refsMdl.signInBtnEl.classList.add('is-hidden');
        refsMdl.userStatusEl.textContent = `Hello, ${user.displayName}`;
        console.log(user);
        this.userId = user.uid;
        // showApp();
        // showLoginState(user);
        // userId = user.uid;
        // hideLoginError();
        // hideLinkError();
        const userLybrary = ref(this.database, `users/${this.userId}/lybrary/`);
        onValue(userLybrary, lybrary => {
          const data = lybrary.val();
          this.writeDataToStorage(data);
          console.log(data);
        });
      } else {
        refsMdl.signOutBtnEl.classList.add('is-hidden');
        refsMdl.signInBtnEl.classList.remove('is-hidden');
        this.userStatus.textContent = 'You are not logged in';
        console.log(`You're not logged in.`);
      }
    });
  }

  // Log out
  async logout() {
    try {
      await signOut(this.firebaseAuth);
      this.userStatus.textContent = 'Logged Out';
      this.userId = null;
    } catch (error) {
      console.log(error);
    }
  }

  async getWatched() {}

  async addToWatched(movieInfo) {
    set(ref(this.database, `users/${this.userId}/lybrary/watched/${movieInfo.filmId}`), {
      filmId: movieInfo.filmId,
      movieName: movieInfo.movieName,
      posterUrl: movieInfo.posterUrl,
      genres: movieInfo.genres,
      year: movieInfo.year,
    });
  }

  async addToQueued(movieInfo) {
    set(ref(this.database, `users/${this.userId}/lybrary/queued/${movieInfo.filmId}`), {
      filmId: movieInfo.filmId,
      movieName: movieInfo.movieName,
      posterUrl: movieInfo.posterUrl,
      genres: movieInfo.genres,
      year: movieInfo.year,
    });
  }

  async removeFromWatched(movieId) {
    remove(ref(this.database, `users/${this.userId}/watched/${movieId}`));
  }
}
