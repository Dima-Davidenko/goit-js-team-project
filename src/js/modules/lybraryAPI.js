import storageAPI from './storageAPI';
import { firebaseInstance } from '../main';
import modalMovieCard from './modalMovieCardAPI';

function lybBtnClickAction(e) {
  if (e.target.dataset.action === 'add') {
    if (firebaseInstance.userId) {
      addToFirebase(+e.target.dataset.id, e.target.dataset.type);
    } else {
      addToLyb(+e.target.dataset.id, e.target.dataset.type);
      modalMovieCard.showLybrary(e.target.dataset.type);
    }
  } else {
    if (firebaseInstance.userId) {
      removeFromFirebase(+e.target.dataset.id, e.target.dataset.type);
    } else {
      removeFromLyb(+e.target.dataset.id, e.target.dataset.type);
      modalMovieCard.showLybrary(e.target.dataset.type);
    }
  }
}

function addToLyb(id, type) {
  const lyb = storageAPI.load(type) || [];
  if (lyb.find(info => info?.id === id)) return;
  const movieInfo = storageAPI.load('modalInfo');
  lyb.push(movieInfo);
  storageAPI.save(type, lyb);
}
async function addToFirebase(id, type) {
  const isInLyb = await firebaseInstance.isInLyb(id, type);
  console.log(`Is movie in DB? `, isInLyb);
  if (isInLyb) return;
  const movieInfo = storageAPI.load('modalInfo');
  firebaseInstance.addToLyb(id, type, movieInfo);
}

async function removeFromFirebase(id, type) {
  firebaseInstance.removeFromLyb(id, type);
}

function removeFromLyb(id, type) {
  const lyb = storageAPI.load(type) || [];
  lyb.splice(
    lyb.findIndex(info => info?.id === id),
    1
  );
  storageAPI.save(type, lyb);
}

export default {
  lybBtnClickAction,
};