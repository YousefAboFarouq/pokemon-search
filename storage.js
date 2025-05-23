// storage.js
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
  }
  function saveFavorites(arr) {
    localStorage.setItem('favorites', JSON.stringify(arr));
  }
  function addFavorite(poke) {
    const arr = getFavorites();
    if (!arr.find(fav => fav.id === poke.id)) {
      arr.push(poke);
      saveFavorites(arr);
    }
  }
  function removeFavorite(id) {
    let arr = getFavorites();
    arr = arr.filter(fav => fav.id !== id);
    saveFavorites(arr);
  }
  window.getFavorites = getFavorites;         // כדי שתהיה גישה גלובלית
  window.saveFavorites = saveFavorites;
  window.addFavorite = addFavorite;
  window.removeFavorite = removeFavorite;
  